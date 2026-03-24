import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  channelId: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  time: { type: String, required: true },
  msgId: { type: String, index: true },
  type: { type: String, default: "text", enum: ["text", "ai", "system"] },
  reactions: { type: Map, of: [String], default: {} },
  replyTo: {
    author:  { type: String },
    content: { type: String },
    msgId:   { type: String },
  },
}, { timestamps: true });

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message; 