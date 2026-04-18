import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:4000";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if this email is already registered before wasting an OTP send
    await connectDB();
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Forward the send-otp request to the auth server
    const authRes = await fetch(`${AUTH_SERVER_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const authData = await authRes.json();

    if (!authRes.ok || !authData.success) {
      return NextResponse.json(
        { success: false, error: authData.error || "Failed to send OTP" },
        { status: authRes.status }
      );
    }

    // Store the pendingToken in an httpOnly cookie so the client never sees it.
    // This prevents the client from decoding the JWT and reading the OTP.
    const response = NextResponse.json({ success: true });

    response.cookies.set("otp_pending_token", authData.pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 5 * 60, // 5 minutes — matches the JWT's expiry
    });

    return response;
  } catch (error: any) {
    console.error("Send OTP proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
