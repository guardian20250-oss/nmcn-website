import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeAnswers, type QuizResultItem } from "@/lib/academy";
import { verifyCreatorToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { lessonId, answers } = await request.json();

    if (!lessonId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "lessonId and answers array are required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: Number(lessonId), status: "published" },
      include: {
        course: { select: { passingScore: true, slug: true, title: true } },
        questions: { orderBy: { order: "asc" } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.questions.length === 0) {
      return NextResponse.json(
        { error: "This lesson has no quiz questions yet" },
        { status: 400 }
      );
    }

    const correctIndexes = lesson.questions.map((q) => q.correctIndex);
    const normalizedAnswers = lesson.questions.map((_, i) => {
      const value = answers[i];
      return typeof value === "number" && Number.isInteger(value) ? value : null;
    });

    const { score, passed } = gradeAnswers(
      correctIndexes,
      normalizedAnswers,
      lesson.course.passingScore
    );

    const results: QuizResultItem[] = lesson.questions.map((q, i) => ({
      correct: normalizedAnswers[i] === q.correctIndex,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    }));

    const token = request.cookies.get("creator-token")?.value;
    const payload = token ? verifyCreatorToken(token) : null;

    try {
      await prisma.quizAttempt.create({
        data: {
          creatorId: payload?.id ?? null,
          lessonId: lesson.id,
          score,
          passed,
          answers: normalizedAnswers,
        },
      });

      if (payload && passed) {
        const existing = await prisma.creatorProgress.findUnique({
          where: {
            creatorId_lessonId: {
              creatorId: payload.id,
              lessonId: lesson.id,
            },
          },
        });

        await prisma.creatorProgress.upsert({
          where: {
            creatorId_lessonId: {
              creatorId: payload.id,
              lessonId: lesson.id,
            },
          },
          create: {
            creatorId: payload.id,
            lessonId: lesson.id,
            bestScore: score,
            passed: true,
            attempts: 1,
            completedAt: new Date(),
          },
          update: {
            bestScore: Math.max(existing?.bestScore ?? 0, score),
            passed: true,
            attempts: { increment: 1 },
            completedAt: existing?.completedAt ?? new Date(),
          },
        });
      }
    } catch (dbError) {
      console.error("Quiz persistence failed:", dbError);
    }

    return NextResponse.json({
      score,
      passed,
      passingScore: lesson.course.passingScore,
      results,
      totalQuestions: lesson.questions.length,
    });
  } catch (error) {
    console.error("Quiz grade error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
