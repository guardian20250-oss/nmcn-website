import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canManageCourses } from "@/lib/auth";

async function requireCourseManager(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return null;
  if (!canManageCourses(staff.role)) return null;
  return staff;
}

function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(request: NextRequest) {
  if (!(await requireCourseManager(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const courses = await prisma.course.findMany({
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, status: true, order: true },
        },
        _count: { select: { certificates: true } },
      },
    });
    return NextResponse.json({
      courses: courses.map((c) => ({
        ...c,
        lessonCount: c.lessons.length,
        certificates: c._count.certificates,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error("Admin courses fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireCourseManager(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let slug = slugify(body.slug || title);
    if (!slug) slug = `course-${Date.now()}`;
    const clash = await prisma.course.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: String(body.description || ""),
        icon: String(body.icon || "GraduationCap"),
        passingScore: Number(body.passingScore) || 70,
        order: Number(body.order) || 0,
        status: String(body.status || "draft"),
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Admin course create error:", error);
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
    if (rest.description !== undefined) data.description = String(rest.description);
    if (rest.icon !== undefined) data.icon = String(rest.icon);
    if (rest.passingScore !== undefined)
      data.passingScore = Math.max(0, Math.min(100, Number(rest.passingScore) || 70));
    if (rest.order !== undefined) data.order = Number(rest.order) || 0;
    if (rest.status !== undefined) data.status = String(rest.status);

    const course = await prisma.course.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ course });
  } catch (error) {
    console.error("Admin course update error:", error);
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
    await prisma.course.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    console.error("Admin course delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
