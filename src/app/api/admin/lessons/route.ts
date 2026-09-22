import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canManageCourses } from "@/lib/auth";

async function requireCourseManager(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return false;
  return canManageCourses(staff.role);
}

function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  if (!(await requireCourseManager(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const courseId = Number(body.courseId);
    const title = String(body.title || "").trim();
    if (!courseId || !title) {
      return NextResponse.json(
        { error: "courseId and title are required" },
        { status: 400 }
      );
    }

    let slug = slugify(body.slug || title);
    if (!slug) slug = `lesson-${Date.now()}`;
    const clash = await prisma.lesson.findFirst({
      where: { courseId, slug },
    });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const max = await prisma.lesson.aggregate({
      where: { courseId },
      _max: { order: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        slug,
        summary: body.summary ? String(body.summary) : null,
        sections: Array.isArray(body.sections) ? body.sections : [],
        order: Number(body.order) || (max._max.order ?? -1) + 1,
        status: String(body.status || "draft"),
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error("Admin lesson create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireCourseManager(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...rest } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (rest.title !== undefined) data.title = String(rest.title);
    if (rest.slug !== undefined) {
      const slug = slugify(rest.slug);
      if (slug) data.slug = slug;
    }
    if (rest.summary !== undefined) data.summary = rest.summary || null;
    if (rest.sections !== undefined)
      data.sections = Array.isArray(rest.sections) ? rest.sections : [];
    if (rest.order !== undefined) data.order = Number(rest.order) || 0;
    if (rest.status !== undefined) data.status = String(rest.status);

    const lesson = await prisma.lesson.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Admin lesson update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireCourseManager(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await prisma.lesson.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    console.error("Admin lesson delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
