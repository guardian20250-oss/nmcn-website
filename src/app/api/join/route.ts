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

    // Get all admin emails (site owner and head admins with role "admin")
    let adminEmails: string[] = [];
    try {
      const admins = await prisma.admin.findMany({
        where: { role: "admin" },
        select: { email: true },
      });
      adminEmails = admins.map((a) => a.email).filter(Boolean);
    } catch (adminError) {
      console.error("Failed to fetch admin emails:", adminError);
    }

    // Fallback to CONTACT_EMAIL if no admins found
    const fallbackEmail = process.env.CONTACT_EMAIL || "nexusmafiacreatornetworkllc@outlook.com";
    const recipients = adminEmails.length > 0 ? adminEmails : [fallbackEmail];

    // Send email notification to all admins (site owner + head admins)
    const emailData = joinApplicationEmail({
      tiktokHandle,
      discordHandle,
      email,
      followerCount: followerCount || "",
      avgLiveViewers: avgLiveViewers || "",
      agencyExperience: agencyExperience || "",
    });

    // Send to each admin
    const emailPromises = recipients.map((to) =>
      sendEmail({ ...emailData, to }).catch((err) => {
        console.error(`Failed to send email to ${to}:`, err);
      })
    );
    await Promise.allSettled(emailPromises);

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