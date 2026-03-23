import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId") || searchParams.get("room") || "general";

    const messages = await Message.find({ room: channelId })
      .sort({ createdAt: 1 })
      .limit(50);

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const channelId = body.channelId || body.room;
    const { author, content, time, msgId } = body;

    if (!channelId || !author || !content || !time) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const message = await Message.create({ room: channelId, author, content, time, msgId });

    try {
      await pusherServer.trigger(`chat-${channelId}`, "new-message", {
        channelId,
        author,
        content,
        time,
        msgId
      });
    } catch (pusherError) {
      console.error("Pusher trigger error:", pusherError);
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}