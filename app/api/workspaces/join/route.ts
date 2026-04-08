import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Workspace } from "@/models/Workspace";

export async function POST(req: Request) {
  try {
    const { inviteCode, firebaseUid } = await req.json();

    if (!inviteCode || !firebaseUid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const workspace = await Workspace.findOne({ inviteCode: inviteCode.trim().toUpperCase() });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Invalid invite code" },
        { status: 404 }
      );
    }

    const isMember = workspace.members.some((m: any) => m.firebaseUid === firebaseUid);

    if (!isMember) {
      workspace.members.push({ firebaseUid, role: "member" });
      await workspace.save();
    }

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
