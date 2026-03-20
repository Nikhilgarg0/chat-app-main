import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room") || "general";

    const messages = await Message.find({ room })
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
    const { room, author, content, time } = body;

    if (!room || !author || !content || !time) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const message = await Message.create({ room, author, content, time });
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}