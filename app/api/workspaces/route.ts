import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Workspace } from "@/models/Workspace";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get("firebaseUid");

    if (!firebaseUid) {
      return NextResponse.json(
        { success: false, error: "Missing firebaseUid" },
        { status: 400 }
      );
    }

    await connectDB();
    const workspaces = await Workspace.find({ "members.firebaseUid": firebaseUid }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, workspaces });
  } catch (error: any) {
    console.error("Workspaces GET Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, firebaseUid } = await req.json();

    if (!name || !firebaseUid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!baseSlug) baseSlug = "workspace";
    
    let slug = baseSlug;
    let counter = 1;
    while (await Workspace.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    let inviteCode = "";
    while (true) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      if (!(await Workspace.findOne({ inviteCode }))) {
        break;
      }
    }

    const workspace = await Workspace.create({
      name,
      slug,
      ownerId: firebaseUid,
      members: [{ firebaseUid, role: "owner" }],
      inviteCode,
    });

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
