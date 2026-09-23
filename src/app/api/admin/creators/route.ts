import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getStaffFromRequest,
  canViewCreatorDashboard,
  canCreateAcademyAccount,
  hashPassword,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canViewCreatorDashboard(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        lessons: {
          where: { status: "published" },
          select: { id: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    const courseLessonIds = new Map<number, number[]>();
    for (const c of courses) {
      courseLessonIds.set(c.id, c.lessons.map((l) => l.id));
    }
    const allLessonIds = new Set<number>();
    for (const ids of courseLessonIds.values()) {
      for (const id of ids) allLessonIds.add(id);
    }

    const creators = await prisma.creatorAccount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        progress: { select: { lessonId: true, passed: true, bestScore: true, completedAt: true } },
        certificates: { select: { id: true, code: true, completedAt: true, courseId: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    const rows = creators.map((creator) => {
      const passed = new Set(
        creator.progress.filter((p) => p.passed).map((p) => p.lessonId)
      );
      const totalLessons = allLessonIds.size || 1;
      const overall = Math.round((passed.size / totalLessons) * 100);

      const byCourse = courses.map((course) => {
        const ids = courseLessonIds.get(course.id) || [];
        const done = ids.filter((id) => passed.has(id)).length;
        return {
          courseId: course.id,
          title: course.title,
          slug: course.slug,
          lessonCount: ids.length,
          completed: done,
          percent: ids.length ? Math.round((done / ids.length) * 100) : 0,
        };
      });

      const lastTs = creator.progress.reduce<number>((max, p) => {
        const t = p.completedAt ? new Date(p.completedAt).getTime() : 0;
        return Math.max(max, t);
      }, 0);

      return {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        tiktokHandle: creator.tiktokHandle,
        createdAt: creator.createdAt,
        createdBy: creator.createdBy,
        lessonCount: creator.progress.length,
        passedLessons: passed.size,
        overallPercent: overall,
        certificates: creator.certificates.length,
        courses: byCourse,
        lastActiveAt: lastTs ? new Date(lastTs).toISOString() : null,
        active: creator.progress.length > 0 || creator.certificates.length > 0,
      };
    });

    const total = rows.length;
    const active = rows.filter((r) => r.active).length;
    const avg =
      total === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.overallPercent, 0) / total);

    return NextResponse.json({
      creators: rows,
      summary: {
        total,
        active,
        inactive: total - active,
        avgPercent: avg,
        certificates: rows.reduce((s, r) => s + r.certificates, 0),
      },
      canCreate: canCreateAcademyAccount(staff.role),
      role: staff.role,
    });
  } catch (error) {
    console.error("Creators dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canCreateAcademyAccount(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const tiktokHandle = body.tiktokHandle ? String(body.tiktokHandle).trim() : null;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.creatorAccount.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const creator = await prisma.creatorAccount.create({
      data: {
        email,
        name,
        password: hashed,
        tiktokHandle,
        status: "active",
        assignedRole: "creator",
        independentCreator: false,
        mustChangePassword: true,
        createdById: staff.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        tiktokHandle: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ creator }, { status: 201 });
  } catch (error) {
    console.error("Create academy account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (staff.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.creatorAccount.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await prisma.creatorAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete creator error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
