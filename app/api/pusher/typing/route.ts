import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const { channelId, username, isTyping } = await req.json();
    if (!channelId || !username) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    
    await pusherServer.trigger(`chat-${channelId}`, "client-typing", { username, isTyping });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
