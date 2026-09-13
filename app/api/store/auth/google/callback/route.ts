import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");
  return new TextEncoder().encode(secret);
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    if (error || !code) {
      console.error("Google OAuth callback error:", error);
      return NextResponse.redirect(`${baseUrl}/cuenta?error=oauth_denied`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/store/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error("Google OAuth credentials missing");
      return NextResponse.redirect(`${baseUrl}/cuenta?error=oauth_config`);
    }

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Failed to exchange code for token:", tokenData);
      return NextResponse.redirect(`${baseUrl}/cuenta?error=oauth_token_failed`);
    }

    // 2. Fetch user profile from Google API
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      console.error("Failed to fetch Google user profile:", googleUser);
      return NextResponse.redirect(`${baseUrl}/cuenta?error=oauth_profile_failed`);
    }

    const cleanEmail = googleUser.email.trim().toLowerCase();
    const givenName = googleUser.given_name || googleUser.name || "Cliente";
    const familyName = googleUser.family_name || "";

    // 3. Find or Create CustomerAccount in PostgreSQL
    let customerAccount = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (customerAccount) {
      // Ensure email_verified is true
      if (!customerAccount.email_verified) {
        customerAccount = await prisma.customerAccount.update({
          where: { id: customerAccount.id },
          data: { email_verified: true },
        });
      }
    } else {
      // Create new customer account
      customerAccount = await prisma.customerAccount.create({
        data: {
          email: cleanEmail,
          name: givenName,
          lastname: familyName,
          email_verified: true,
          is_active: true,
        },
      });
    }

    if (!customerAccount.is_active) {
      return NextResponse.redirect(`${baseUrl}/cuenta?error=account_disabled`);
    }

    // 4. Create Customer Session JWT
    const sessionPayload = {
      id: customerAccount.id,
      name: customerAccount.name,
      lastname: customerAccount.lastname,
      email: customerAccount.email,
      phone: customerAccount.phone,
      doc_type: customerAccount.doc_type || "V",
      doc_number: customerAccount.doc_number || "",
    };

    const token = await new SignJWT(sessionPayload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getSecret());

    const rawState = searchParams.get("state") || "/cuenta";
    const targetPath = rawState.startsWith("/") ? rawState : "/cuenta";

    const response = NextResponse.redirect(`${baseUrl}${targetPath}`);

    response.cookies.set("cenicola_customer_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("GET /api/store/auth/google/callback:", err);
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    return NextResponse.redirect(`${baseUrl}/cuenta?error=oauth_server_error`);
  }
}
