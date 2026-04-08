import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      firebaseUid, email, displayName, avatarUrl,
      bio, customStatus, timezone, socialLinks, 
      notificationPrefs, theme, coverColor, onboardingComplete
    } = body;

    if (!firebaseUid || !email || !displayName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData: any = {
      firebaseUid,
      email,
      displayName: typeof displayName === 'string' ? displayName.trim() : displayName,
    };

    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (typeof bio === "string") updateData.bio = bio.trim().substring(0, 160);
    if (typeof customStatus === "string") updateData.customStatus = customStatus.trim().substring(0, 80);
    if (typeof timezone === "string") updateData.timezone = timezone.trim();
    
    if (socialLinks && typeof socialLinks === "object") {
      updateData.socialLinks = {
        twitter: typeof socialLinks.twitter === "string" ? socialLinks.twitter.trim() : undefined,
        github: typeof socialLinks.github === "string" ? socialLinks.github.trim() : undefined,
        linkedin: typeof socialLinks.linkedin === "string" ? socialLinks.linkedin.trim() : undefined,
        website: typeof socialLinks.website === "string" ? socialLinks.website.trim() : undefined,
      };
    }

    if (notificationPrefs && typeof notificationPrefs === "object") {
      updateData.notificationPrefs = {
        mentions: typeof notificationPrefs.mentions === "boolean" ? notificationPrefs.mentions : true,
        allMessages: typeof notificationPrefs.allMessages === "boolean" ? notificationPrefs.allMessages : false,
        sounds: typeof notificationPrefs.sounds === "boolean" ? notificationPrefs.sounds : true,
      };
    }

    if (typeof theme === "string" && ["light", "dark", "system"].includes(theme)) {
      updateData.theme = theme;
    }

    if (typeof coverColor === "string") {
      updateData.coverColor = coverColor.trim();
    }

    if (typeof onboardingComplete === "boolean") {
      updateData.onboardingComplete = onboardingComplete;
    }

    let user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Profile GET Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const uid = await verifyToken(req);
    if (!uid) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOneAndDelete({ firebaseUid: uid });
    
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
