import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Channel } from "@/models/Channel";
import { Workspace } from "@/models/Workspace";
import { verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const uid = await verifyToken(req);
    if (!uid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, name } = await req.json();

    if (!workspaceId || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    // S6 — verify the requester is actually a member of this workspace
    const isMember = workspace.members.some((m: any) => m.firebaseUid === uid);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const channel = await Channel.create({
      workspaceId,
      name: name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-"),
      createdBy: uid,
    });

    workspace.channels.push(channel._id);
    await workspace.save();

    return NextResponse.json({ success: true, channel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
