import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:4000";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Read the pendingToken from the httpOnly cookie
    const cookieStore = await cookies();
    const pendingToken = cookieStore.get("otp_pending_token")?.value;

    if (!pendingToken) {
      return NextResponse.json(
        { success: false, error: "OTP session expired or not found. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Forward the verify request to the auth server
    const authRes = await fetch(`${AUTH_SERVER_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, pendingToken }),
    });

    const authData = await authRes.json();

    if (!authRes.ok || !authData.success) {
      return NextResponse.json(
        { success: false, error: authData.error || "Invalid OTP" },
        { status: authRes.status }
      );
    }

    // OTP verified — clear the cookie
    const response = NextResponse.json({ success: true, verified: true });

    response.cookies.set("otp_pending_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0, // Delete the cookie
    });

    return response;
  } catch (error: any) {
    console.error("Verify OTP proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
