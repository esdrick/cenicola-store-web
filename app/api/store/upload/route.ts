import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Allowed MIME types for payment receipts
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo de imagen" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Sube una imagen en formato JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen es demasiado pesada. El tamaño máximo permitido es 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const filename = `comprobante_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

    // 1. Try Cloudinary Storage if configured (Recommended for Production)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "comprobantes";
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

        const cloudinaryFormData = new FormData();
        const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
        cloudinaryFormData.append("file", base64Data);
        cloudinaryFormData.append("api_key", apiKey);
        cloudinaryFormData.append("timestamp", String(timestamp));
        cloudinaryFormData.append("signature", signature);
        cloudinaryFormData.append("folder", folder);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: cloudinaryFormData,
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData?.secure_url) {
            return NextResponse.json({ success: true, url: cloudData.secure_url });
          }
        } else {
          const cloudErr = await cloudRes.json().catch(() => ({}));
          console.warn("Cloudinary upload failed, attempting fallback:", cloudErr);
        }
      } catch (err) {
        console.warn("Cloudinary upload error, attempting fallback:", err);
      }
    }

    // 2. Try Supabase Storage if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error: uploadError } = await supabase.storage
          .from("comprobantes")
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("comprobantes").getPublicUrl(filename);
          if (publicUrlData?.publicUrl) {
            return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
          }
        }
      } catch (err) {
        console.warn("Supabase Storage upload fallback to local disk:", err);
      }
    }

    // 3. Fallback: Local disk storage in public/uploads/comprobantes/ (for local dev offline)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "comprobantes");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const localUrl = `/uploads/comprobantes/${filename}`;
    return NextResponse.json({ success: true, url: localUrl });
  } catch (err) {
    console.error("POST /api/store/upload error:", err);
    return NextResponse.json({ error: "Error al subir la imagen del comprobante" }, { status: 500 });
  }
}
