import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getStaffFromRequest,
  canViewCreatorDashboard,
  canCreateAcademyAccount,
  canManageStaff,
  hashPassword,
  updateCreatorAccount,
  deleteCreatorAccount,
  getCoursesForRole,
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
        role: true,
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

    const creators = await prisma.creatorAccount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        progress: { select: { lessonId: true, passed: true, bestScore: true, completedAt: true } },
        certificates: { select: { id: true, code: true, completedAt: true, courseId: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    const rows = creators.map((creator) => {
      const allowedCourseRoles = getCoursesForRole(
        creator.assignedRole,
        creator.independentCreator
      );
      const roleCourses = courses.filter((c) => allowedCourseRoles.includes(c.role));

      const allowedLessonIds = new Set<number>();
      const allowedCourseIds = new Set<number>();
      for (const course of roleCourses) {
        allowedCourseIds.add(course.id);
        for (const id of courseLessonIds.get(course.id) || []) {
          allowedLessonIds.add(id);
        }
      }

      const passedAll = new Set(
        creator.progress.filter((p) => p.passed).map((p) => p.lessonId)
      );
      const passed = new Set(
        [...passedAll].filter((id) => allowedLessonIds.has(id))
      );
      const totalLessons = allowedLessonIds.size || 1;
      const overall = Math.round((passed.size / totalLessons) * 100);

      const byCourse = roleCourses.map((course) => {
        const ids = courseLessonIds.get(course.id) || [];
        const done = ids.filter((id) => passedAll.has(id)).length;
        return {
          courseId: course.id,
          title: course.title,
          slug: course.slug,
          role: course.role,
          lessonCount: ids.length,
          completed: done,
          percent: ids.length ? Math.round((done / ids.length) * 100) : 0,
        };
      });

      const lastTs = creator.progress.reduce<number>((max, p) => {
        const t = p.completedAt ? new Date(p.completedAt).getTime() : 0;
        return Math.max(max, t);
      }, 0);

      const roleCertificates = creator.certificates.filter(
        (cert) => !cert.courseId || allowedCourseIds.has(cert.courseId)
      );

      return {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        tiktokHandle: creator.tiktokHandle,
        status: creator.status,
        assignedRole: creator.assignedRole,
        independentCreator: creator.independentCreator,
        createdAt: creator.createdAt,
        createdBy: creator.createdBy,
        lessonCount: allowedLessonIds.size,
        passedLessons: passed.size,
        overallPercent: overall,
        certificates: roleCertificates.length,
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

export async function PATCH(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updated = await updateCreatorAccount(id, {
      name: body.name,
      email: body.email,
      tiktokHandle: body.tiktokHandle,
      assignedRole: body.assignedRole,
      status: body.status,
      independentCreator: body.independentCreator,
      password: body.password,
    });
    return NextResponse.json({ creator: updated });
  } catch (error) {
    console.error("Update creator error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deleteCreatorAccount(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete creator error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
