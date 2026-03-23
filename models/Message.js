import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  time: { type: String, required: true },
  msgId: { type: String, index: true },
  type: { type: String, default: "text", enum: ["text", "ai", "system"] },
}, { timestamps: true });

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message; 