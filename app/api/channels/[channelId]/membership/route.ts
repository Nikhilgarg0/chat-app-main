import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Channel } from "@/models/Channel";

export async function GET(req: Request, context: { params: Promise<{ channelId: string }> }) {
  try {
    const url = new URL(req.url);
    const firebaseUid = url.searchParams.get("firebaseUid");
    if (!firebaseUid) {
      return NextResponse.json({ success: false, error: "Missing firebaseUid" }, { status: 400 });
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

    const isMember = channel.members.includes(firebaseUid);

    return NextResponse.json({ success: true, isMember });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
