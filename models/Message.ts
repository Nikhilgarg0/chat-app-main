import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReplyTo {
  author: string;
  content: string;
  msgId: string;
}

export interface IMessage extends Document {
  channelId: string;
  author: string;
  firebaseUid?: string;
  content: string;
  time: string;
  timestamp: Date;
  msgId?: string;
  type: "text" | "ai" | "system";
  reactions: Map<string, string[]>;
  replyTo?: IReplyTo;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    channelId: { type: String, required: true, trim: true, index: true },
    author: { type: String, required: true, trim: true },
    firebaseUid: { type: String, required: false, index: true },
    content: { type: String, required: true, trim: true },
    time: { type: String, required: false },
    timestamp: { type: Date, default: Date.now, index: true },
    msgId: { type: String, index: true },
    type: { type: String, default: "text", enum: ["text", "ai", "system"] },
    reactions: { type: Map, of: [String], default: {} },
    replyTo: {
      author: { type: String },
      content: { type: String },
      msgId: { type: String },
    },
  },
  { timestamps: true }
);

// Compound index for efficient channel + time queries
MessageSchema.index({ channelId: 1, createdAt: -1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
