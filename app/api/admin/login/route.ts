import { NextResponse } from "next/server";
import crypto from "crypto";

// Simple HMAC-based token generation using a secret derived from the admin password
function generateAdminToken(email: string): string {
  const secret = process.env.ADMIN_PASSWORD || "fallback-secret";
  const payload = JSON.stringify({ email, iat: Date.now() });
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const token = Buffer.from(payload).toString("base64") + "." + signature;
  return token;
}

export function verifyAdminToken(token: string): { email: string; iat: number } | null {
  try {
    const secret = process.env.ADMIN_PASSWORD || "fallback-secret";
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (signature !== expectedSig) return null;

    const parsed = JSON.parse(payload);

    // Token expires after 24 hours
    if (Date.now() - parsed.iat > 24 * 60 * 60 * 1000) return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || adminEmails.length === 0) {
      return NextResponse.json({ success: false, error: "Admin not configured" }, { status: 500 });
    }

    // Validate credentials
    if (!adminEmails.includes(email.trim().toLowerCase())) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (password !== adminPassword) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Generate token
    const token = generateAdminToken(email.trim().toLowerCase());

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error("Admin Login Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
