import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  customStatus?: string;
  timezone?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  notificationPrefs?: {
    mentions?: boolean;
    allMessages?: boolean;
    sounds?: boolean;
  };
  theme?: "light" | "dark" | "system";
  coverColor?: string;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true, match: /^[a-zA-Z0-9_]{3,20}$/ },
  displayName: { type: String, required: true },
  avatarUrl: { type: String, default: "" },
  bio: { type: String, maxlength: 160 },
  customStatus: { type: String, maxlength: 80 },
  timezone: { type: String },
  socialLinks: {
    twitter: { type: String },
    github: { type: String },
    linkedin: { type: String },
    website: { type: String },
  },
  notificationPrefs: {
    mentions: { type: Boolean, default: true },
    allMessages: { type: Boolean, default: false },
    sounds: { type: Boolean, default: true },
  },
  theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
  coverColor: { type: String },
  onboardingComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: false, updatedAt: true } });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
