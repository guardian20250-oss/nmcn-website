import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, joinApplicationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tiktokHandle, discordHandle, email, followerCount, avgLiveViewers, agencyExperience } = body;

    if (!tiktokHandle || !discordHandle || !email) {
      return NextResponse.json(
        { error: "Tiktok handle, Discord handle, and email are required" },
        { status: 400 }
      );
    }

    const application = await prisma.joinApplication.create({
      data: {
        tiktokHandle,
        discordHandle,
        email,
        followerCount: followerCount || null,
        avgLiveViewers: avgLiveViewers || null,
        agencyExperience: agencyExperience || null,
      },
    });

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

    return NextResponse.json(
      { message: "Application submitted successfully", id: application.id },
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
