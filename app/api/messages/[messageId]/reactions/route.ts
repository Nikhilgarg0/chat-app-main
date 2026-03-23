import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request, context: { params: Promise<{ messageId: string }> }) {
  try {
    const { messageId } = await context.params;
    const { emoji, firebaseUid, username } = await req.json();

    if (!messageId || !emoji || !firebaseUid) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    await connectDB();
    
    const message = await Message.findById(messageId);
    if (!message) {
       return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    const currentReactions = message.reactions || new Map();
    let userArray = currentReactions.get(emoji) || [];

    if (userArray.includes(firebaseUid)) {
      userArray = userArray.filter((id: string) => id !== firebaseUid);
    } else {
      userArray.push(firebaseUid);
    }

    if (userArray.length === 0) {
      currentReactions.delete(emoji);
    } else {
      currentReactions.set(emoji, userArray);
    }

    message.reactions = currentReactions;
    await message.save();

    const reactionsObj = Object.fromEntries(message.reactions);

    await pusherServer.trigger(`chat-${message.channelId}`, "reaction-update", {
      messageId: message._id,
      reactions: reactionsObj
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
