import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params;
    const { authorName } = await req.json();

    if (!messageId) {
      return NextResponse.json({ success: false, error: "Missing messageId" }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Verify the requester is the author
    if (authorName && message.author !== authorName) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await Message.findByIdAndDelete(messageId);

    // Notify all clients subscribed to this channel
    await pusherServer.trigger(`chat-${message.channelId}`, "message-deleted", {
      messageId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/messages/[messageId] error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
