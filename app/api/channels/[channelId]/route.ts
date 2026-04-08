import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Channel } from "@/models/Channel";
import { Workspace } from "@/models/Workspace";
import { verifyToken } from "@/lib/firebaseAdmin";
import Message from "@/models/Message";

export async function DELETE(req: Request, context: { params: Promise<{ channelId: string }> }) {
  try {
    const uid = await verifyToken(req);
    if (!uid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { channelId } = params;

    if (!channelId) {
      return NextResponse.json({ success: false, error: "Missing channelId" }, { status: 400 });
    }

    await connectDB();

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return NextResponse.json({ success: false, error: "Channel not found" }, { status: 404 });
    }

    const workspace = await Workspace.findById(channel.workspaceId);
    if (workspace) {
      workspace.channels = workspace.channels.filter((c: any) => c.toString() !== channelId);
      await workspace.save();
    }

    await Channel.findByIdAndDelete(channelId);
    
    try {
      await Message.deleteMany({ channelId });
    } catch (e) {
      // ignore message delete error
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
