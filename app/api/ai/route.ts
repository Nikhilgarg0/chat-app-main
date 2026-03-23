import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { generateAIResponse } from "@/lib/gemini";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const { command, messages, channelId, workspaceId } = await req.json();

    if (!command || !channelId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const contextMessages = await Message.find({ room: channelId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    const contextStr = contextMessages
      .reverse()
      .map((m: any) => `[${m.time}] ${m.author}: ${m.content}`)
      .join("\n");

    let prompt = "";
    
    if (command === "ask") {
      const userQuestion = messages || "";
      prompt = `You are Nexus AI, a helpful assistant. \nBased on this conversation: ${contextStr}\nAnswer this question: ${userQuestion}\nBe concise and helpful.`;
    } else if (command === "summarize") {
      prompt = `You are Nexus AI. Summarize this conversation in 3-5 bullet points: ${contextStr}`;
    } else if (command === "todo") {
      prompt = `You are Nexus AI. Extract all action items and tasks from this conversation: ${contextStr}\nFormat as a numbered list.`;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid command" },
        { status: 400 }
      );
    }

    const aiResponseText = await generateAIResponse(prompt, contextStr);

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    const msgId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const message = await Message.create({
      room: channelId,
      author: "Nexus AI",
      content: aiResponseText,
      time,
      msgId,
      type: "ai"
    });

    try {
      await pusherServer.trigger(`chat-${channelId}`, "new-message", {
        channelId,
        author: "Nexus AI",
        content: aiResponseText,
        time,
        msgId,
        type: "ai"
      });
    } catch (pusherError) {
      console.error("Pusher trigger error:", pusherError);
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
