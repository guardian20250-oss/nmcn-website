import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseOptions, parseSections } from "@/lib/academy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lessonId = parseInt(id, 10);
    if (Number.isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, status: "published", course: { status: "published" } },
      include: {
        course: {
          select: { id: true, title: true, slug: true, passingScore: true },
        },
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            prompt: true,
            type: true,
            options: true,
            order: true,
          },
        },
      },
    });

    if (!lesson) {
      // fetch siblings separately to avoid invalid include
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const siblings = await prisma.lesson.findMany({
      where: { courseId: lesson.courseId, status: "published" },
      orderBy: { order: "asc" },
      select: { id: true, title: true, slug: true, order: true },
    });

    const index = siblings.findIndex((s) => s.id === lesson.id);

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        summary: lesson.summary,
        sections: parseSections(lesson.sections),
        course: lesson.course,
        questions: lesson.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          options: parseOptions(q.options),
          order: q.order,
        })),
        prev:
          index > 0
            ? { slug: siblings[index - 1].slug, title: siblings[index - 1].title }
            : null,
        next:
          index >= 0 && index < siblings.length - 1
            ? { slug: siblings[index + 1].slug, title: siblings[index + 1].title }
            : null,
        siblingLessonIds: siblings.map((s) => s.id),
      },
    });
  } catch (error) {
    console.error("Academy lesson fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
