import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChannel extends Document {
  workspaceId: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
}

const channelSchema = new Schema<IChannel>({
  workspaceId: { type: String, required: true },
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  members: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Channel: Model<IChannel> = mongoose.models.Channel || mongoose.model<IChannel>('Channel', channelSchema);
