import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Channel } from "@/models/Channel";
import { Workspace } from "@/models/Workspace";

export async function POST(req: Request) {
  try {
    const { workspaceId, name, firebaseUid } = await req.json();

    if (!workspaceId || !name || !firebaseUid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    const channel = await Channel.create({
      workspaceId,
      name: name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-"),
      createdBy: firebaseUid,
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
