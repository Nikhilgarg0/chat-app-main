import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const { workspaceId, username, status } = await req.json();
    
    if (!workspaceId || !username || !status) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    await pusherServer.trigger(`workspace-${workspaceId}`, "presence-update", {
      username,
      status
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
