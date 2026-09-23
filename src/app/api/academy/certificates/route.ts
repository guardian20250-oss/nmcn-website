import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCreatorToken } from "@/lib/auth";
import { certificateCode } from "@/lib/academy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courseSlug = String(body.courseSlug || "");
    const learnerName = String(body.learnerName || "").trim();
    const guestProgress: { lessonId: number; passed: boolean }[] = Array.isArray(
      body.lessonProgress
    )
      ? body.lessonProgress
      : [];

    if (!courseSlug || !learnerName) {
      return NextResponse.json(
        { error: "courseSlug and learnerName are required" },
        { status: 400 }
      );
    }
    if (learnerName.length < 2 || learnerName.length > 80) {
      return NextResponse.json(
        { error: "Name must be 2-80 characters" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: { slug: courseSlug, status: "published" },
      include: {
        lessons: { where: { status: "published" }, select: { id: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (course.lessons.length === 0) {
      return NextResponse.json({ error: "Course has no lessons" }, { status: 400 });
    }

    const token = request.cookies.get("creator-token")?.value;
    const payload = token ? verifyCreatorToken(token) : null;

  let eligible = false;
  let nameToUse = learnerName;
  let creatorId: number | undefined;

  if (payload) {
    creatorId = payload.id;
      const rows = await prisma.creatorProgress.findMany({
        where: { creatorId: payload.id, lessonId: { in: course.lessons.map((l) => l.id) } },
        select: { lessonId: true, passed: true },
      });
      const passedSet = new Set(rows.filter((r) => r.passed).map((r) => r.lessonId));
      eligible = course.lessons.every((l) => passedSet.has(l.id));

      const creatorAccount = await prisma.creatorAccount.findUnique({
        where: { id: payload.id },
        select: { name: true },
      });
      if (creatorAccount?.name && !learnerName) nameToUse = creatorAccount.name;
      if (!learnerName && creatorAccount?.name) nameToUse = creatorAccount.name;
    } else {
      const lessonIds = new Set(course.lessons.map((l) => l.id));
      const providedPassed = new Set(
        guestProgress
          .filter((p) => p.passed && lessonIds.has(Number(p.lessonId)))
          .map((p) => Number(p.lessonId))
      );
      eligible = course.lessons.every((l) => providedPassed.has(l.id));
    }

    if (!eligible) {
      return NextResponse.json(
        { error: "Complete every lesson quiz before claiming a certificate" },
        { status: 403 }
      );
    }

    const existing = await prisma.certificate.findFirst({
      where: {
        courseId: course.id,
        ...(creatorId ? { creatorId } : { learnerName: nameToUse }),
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({
        certificate: {
          code: existing.code,
          learnerName: existing.learnerName,
          courseTitle: course.title,
          courseSlug: course.slug,
          completedAt: existing.completedAt,
        },
        alreadyIssued: true,
      });
    }

    const code = certificateCode(course.slug);
    const certificate = await prisma.certificate.create({
      data: {
        code,
        learnerName: nameToUse,
        creatorId: creatorId ?? undefined,
        courseId: course.id,
      },
    });

    return NextResponse.json(
      {
        certificate: {
          code: certificate.code,
          learnerName: certificate.learnerName,
          courseTitle: course.title,
          courseSlug: course.slug,
          completedAt: certificate.completedAt,
        },
        alreadyIssued: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Certificate issue error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
