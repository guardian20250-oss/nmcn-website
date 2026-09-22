import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, joinApplicationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tiktokHandle, discordHandle, email, followerCount, avgLiveViewers, agencyExperience } = body;

    if (!tiktokHandle || !discordHandle || !email) {
      return NextResponse.json(
        { error: "TikTok handle, Discord handle, and email are required" },
        { status: 400 }
      );
    }

    // Try to save to database
    try {
      await prisma.joinApplication.create({
        data: {
          tiktokHandle,
          discordHandle,
          email,
          followerCount: followerCount || null,
          avgLiveViewers: avgLiveViewers || null,
          agencyExperience: agencyExperience || null,
        },
      });
    } catch (dbError) {
      console.error("Database save failed, continuing without DB:", dbError);
      // Don't fail the request if DB is unavailable
    }

    // Try to send email notification
    try {
      await sendEmail(
        joinApplicationEmail({
          tiktokHandle,
          discordHandle,
          email,
          followerCount: followerCount || "",
          avgLiveViewers: avgLiveViewers || "",
          agencyExperience: agencyExperience || "",
        })
      );
    } catch (emailError) {
      console.error("Email send failed, continuing without email:", emailError);
    }

    return NextResponse.json(
      { message: "Application submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Join form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}