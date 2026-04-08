import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Workspace } from "@/models/Workspace";
import { Channel } from "@/models/Channel";
import { verifyToken } from "@/lib/firebaseAdmin";

export async function GET(req: Request, context: { params: Promise<{ workspaceId: string }> }) {
  try {
    const params = await context.params;
    if (!params.workspaceId) {
      return NextResponse.json(
        { success: false, error: "Missing workspaceId" },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Explicitly populate Channel here to ensure the model is loaded
    // though Mongoose handles this via refs if 'Channel' is registered
    await Channel.init();

    const url = new URL(req.url);
    const firebaseUid = url.searchParams.get("firebaseUid");

    const workspace = await Workspace.findById(params.workspaceId).populate("channels");

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (firebaseUid) {
      const allChannels = workspace.channels;
      const joinedChannels = allChannels.filter((c: any) => c.members && c.members.includes(firebaseUid));
      return NextResponse.json({ success: true, workspace, allChannels, joinedChannels });
    }

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    console.error("Workspace GET Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ workspaceId: string }> }) {
  try {
    const uid = await verifyToken(req);
    if (!uid) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    if (!params.workspaceId) {
      return NextResponse.json({ success: false, error: "Missing workspaceId" }, { status: 400 });
    }

    await connectDB();
    const workspace = await Workspace.findById(params.workspaceId);
    
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
    }
    
    await Workspace.findByIdAndDelete(params.workspaceId);
    await Channel.deleteMany({ workspaceId: params.workspaceId });
    
    // Also removing workspace references from users might be needed in a full prod app
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Workspace DELETE Error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
