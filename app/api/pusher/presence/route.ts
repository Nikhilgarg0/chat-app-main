import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const uid = await verifyToken(req);
    if (!uid) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

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
