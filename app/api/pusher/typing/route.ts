import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  try {
    const { channelId, username, isTyping } = await req.json();

    await pusherServer.trigger(`chat-${channelId}`, "user-typing", { username, isTyping });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
