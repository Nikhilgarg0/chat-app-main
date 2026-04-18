import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Workspace } from "@/models/Workspace";
import { verifyToken } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const uid = await verifyToken(req);
    if (!uid) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const workspaces = await Workspace.find({ "members.firebaseUid": uid }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, workspaces });
  } catch (error: any) {
    console.error("Workspaces GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const uid = await verifyToken(req);
    if (!uid) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!baseSlug) baseSlug = "workspace";

    // Q6 — drop the race-prone while loop, let MongoDB unique index handle it
    const inviteCode = crypto.randomUUID().substring(0, 6).toUpperCase();

    try {
      const workspace = await Workspace.create({
        name,
        slug: baseSlug,
        ownerId: uid,
        members: [{ firebaseUid: uid, role: "owner" }],
        inviteCode,
      });
      return NextResponse.json({ success: true, workspace });
    } catch (err: any) {
      // Duplicate slug — append a random suffix and retry once
      if (err.code === 11000 && err.keyPattern?.slug) {
        const fallbackSlug = `${baseSlug}-${crypto.randomUUID().substring(0, 4)}`;
        const workspace = await Workspace.create({
          name,
          slug: fallbackSlug,
          ownerId: uid,
          members: [{ firebaseUid: uid, role: "owner" }],
          inviteCode,
        });
        return NextResponse.json({ success: true, workspace });
      }
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
