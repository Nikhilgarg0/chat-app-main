import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  workspaces: string[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  avatarUrl: { type: String },
  workspaces: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
