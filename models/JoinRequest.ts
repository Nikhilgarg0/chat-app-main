import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IJoinRequest extends Document {
  workspaceId: mongoose.Types.ObjectId;
  firebaseUid: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
}

const joinRequestSchema = new Schema<IJoinRequest>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  firebaseUid: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  respondedBy: { type: String },
});

// Compound index: one pending request per user per workspace
joinRequestSchema.index({ workspaceId: 1, firebaseUid: 1, status: 1 });

export const JoinRequest: Model<IJoinRequest> = mongoose.models.JoinRequest || mongoose.model<IJoinRequest>('JoinRequest', joinRequestSchema);
