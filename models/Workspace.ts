import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWorkspaceMember {
  firebaseUid: string;
  role: string;
}

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  ownerId: string;
  members: IWorkspaceMember[];
  inviteCode: string;
  createdAt: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>({
  firebaseUid: { type: String, required: true },
  role: { type: String, default: "member" }
}, { _id: false });

const workspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  members: [workspaceMemberSchema],
  inviteCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export const Workspace: Model<IWorkspace> = mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', workspaceSchema);
