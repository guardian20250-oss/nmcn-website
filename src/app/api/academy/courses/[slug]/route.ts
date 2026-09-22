import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const course = await prisma.course.findFirst({
      where: { slug, status: "published" },
      include: {
        lessons: {
          where: { status: "published" },
          orderBy: { order: "asc" },
          select: { id: true, title: true, slug: true, summary: true, order: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        icon: course.icon,
        passingScore: course.passingScore,
        lessons: course.lessons,
        lessonIds: course.lessons.map((l) => l.id),
      },
    });
  } catch (error) {
    console.error("Academy course fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
