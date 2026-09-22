import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, contactMessageEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Try to save to database
    try {
      await prisma.contactMessage.create({
        data: { name, email, subject, message },
      });
    } catch (dbError) {
      console.error("Database save failed, continuing without DB:", dbError);
    }

    // Try to send email notification
    try {
      await sendEmail(contactMessageEmail({ name, email, subject, message }));
    } catch (emailError) {
      console.error("Email send failed, continuing without email:", emailError);
    }

    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}