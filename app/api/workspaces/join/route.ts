import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Workspace } from "@/models/Workspace";
import { verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // Auth gate
    const uid = await verifyToken(req);
    if (!uid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, error: "Missing invite code" },
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

    const isMember = workspace.members.some((m: any) => m.firebaseUid === uid);

    if (!isMember) {
      workspace.members.push({ firebaseUid: uid, role: "member" });
      await workspace.save();
    }

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    console.error("Workspace Join Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
