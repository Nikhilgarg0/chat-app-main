import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const before = searchParams.get("before");

    const query = { channelId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    messages.reverse(); // chronological order for the client

    return NextResponse.json({ success: true, messages, hasMore: messages.length === 50 });
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
    const { channelId, author, content, time, msgId, replyTo } = body;

    if (!channelId || !author || !content || !time) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const message = await Message.create({
      channelId, author, content, time, msgId,
      ...(replyTo ? { replyTo } : {}),
    });

    try {
      await pusherServer.trigger(`chat-${channelId}`, "new-message", {
        channelId,
        author,
        content,
        time,
        msgId,
        ...(replyTo ? { replyTo } : {}),
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