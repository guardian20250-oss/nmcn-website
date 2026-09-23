import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ testimonials });
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { status, name, role, quote, rating } = body;
    const data: Record<string, unknown> = {};
    if (status !== undefined) {
      const nextStatus = String(status);
      if (!["pending", "approved", "rejected"].includes(nextStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = nextStatus;
    }
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role || null;
    if (quote !== undefined) data.quote = quote;
    if (rating !== undefined) data.rating = rating;

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data,
    });

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error("Testimonial update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ message: "Testimonial deleted" });
  } catch (error) {
    console.error("Testimonial delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
