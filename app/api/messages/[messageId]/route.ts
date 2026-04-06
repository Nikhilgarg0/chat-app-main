import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher-server";
import { verifyToken } from "@/lib/firebaseAdmin";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const uid = await verifyToken(req);
    if (!uid) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { messageId } = await context.params;

    if (!messageId) {
      return NextResponse.json({ success: false, error: "Missing messageId" }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    if (message.firebaseUid !== uid) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await Message.findByIdAndDelete(messageId);

    await pusherServer.trigger(`chat-${message.channelId}`, "message-deleted", { messageId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/messages/[messageId] error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
