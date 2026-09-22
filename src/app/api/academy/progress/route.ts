import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCreatorToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("creator-token")?.value;
  const payload = token ? verifyCreatorToken(token) : null;
  if (!payload) {
    return NextResponse.json({ progress: [] });
  }

  try {
    const rows = await prisma.creatorProgress.findMany({
      where: { creatorId: payload.id },
      select: { lessonId: true, bestScore: true, passed: true },
    });
    return NextResponse.json({ progress: rows });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json({ progress: [] });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("creator-token")?.value;
  const payload = token ? verifyCreatorToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items: { lessonId: number; score: number; passed: boolean }[] =
      Array.isArray(body.progress) ? body.progress : [];

    const validItems: { lessonId: number; score: number; passed: boolean }[] = [];
    for (const item of items) {
      const lessonId = Number(item.lessonId);
      if (!Number.isInteger(lessonId)) continue;
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      });
      if (!lesson) continue;
      validItems.push({
        lessonId,
        score: Math.max(0, Math.min(100, Number(item.score) || 0)),
        passed: Boolean(item.passed),
      });
    }

    for (const item of validItems) {
      if (!item.passed) continue;
      const existing = await prisma.creatorProgress.findUnique({
        where: {
          creatorId_lessonId: {
            creatorId: payload.id,
            lessonId: item.lessonId,
          },
        },
      });

      await prisma.creatorProgress.upsert({
        where: {
          creatorId_lessonId: {
            creatorId: payload.id,
            lessonId: item.lessonId,
          },
        },
        create: {
          creatorId: payload.id,
          lessonId: item.lessonId,
          bestScore: item.score,
          passed: true,
          attempts: 1,
          completedAt: new Date(),
        },
        update: {
          bestScore: Math.max(existing?.bestScore ?? 0, item.score),
          passed: true,
          completedAt: existing?.completedAt ?? new Date(),
        },
      });
    }

    const progress = await prisma.creatorProgress.findMany({
      where: { creatorId: payload.id },
      select: { lessonId: true, bestScore: true, passed: true },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Progress save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
