import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cenicola_customer_session")?.value;
    const secret = getSecret();

    if (!token || !secret) {
      return NextResponse.json({ authenticated: false, customer: null }, { status: 200 });
    }

    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({ authenticated: true, customer: payload });
  } catch {
    return NextResponse.json({ authenticated: false, customer: null }, { status: 200 });
  }
}
