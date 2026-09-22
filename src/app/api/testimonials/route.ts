import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, testimonialEmail } from "@/lib/email";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, role: true, quote: true, rating: true },
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Testimonials fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, quote, rating } = body;

    if (!name || !quote) {
      return NextResponse.json(
        { error: "Name and testimonial are required" },
        { status: 400 }
      );
    }

    const parsedRating = Math.min(5, Math.max(1, parseInt(rating) || 5));

    let testimonial;
    try {
      testimonial = await prisma.testimonial.create({
        data: {
          name,
          role: role || null,
          quote,
          rating: parsedRating,
          status: "pending",
        },
      });
    } catch (dbError) {
      console.error("Database save failed:", dbError);
      return NextResponse.json(
        { error: "Failed to submit testimonial" },
        { status: 500 }
      );
    }

    try {
      await sendEmail(
        testimonialEmail({ name, role: role || "", quote, rating: parsedRating })
      );
    } catch (emailError) {
      console.error("Email send failed, continuing without email:", emailError);
    }

    return NextResponse.json(
      { message: "Testimonial submitted for review", id: testimonial.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Testimonial submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
