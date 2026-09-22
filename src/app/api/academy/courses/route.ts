import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: "published" },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          where: { status: "published" },
          orderBy: { order: "asc" },
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        passingScore: c.passingScore,
        lessonCount: c.lessons.length,
        lessonIds: c.lessons.map((l) => l.id),
      })),
    });
  } catch (error) {
    console.error("Academy courses fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
