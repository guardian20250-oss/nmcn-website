import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canManageCourses } from "@/lib/auth";

async function requireCourseManager(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return false;
  return canManageCourses(staff.role);
}

export async function POST(request: NextRequest) {
  if (!(await requireCourseManager(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const lessonId = Number(body.lessonId);
    const prompt = String(body.prompt || "").trim();
    const options = Array.isArray(body.options)
      ? body.options.map((o: unknown) => String(o))
      : [];
    const correctIndex = Number(body.correctIndex);

    if (!lessonId || !prompt || options.length < 2) {
      return NextResponse.json(
        { error: "lessonId, prompt, and at least 2 options are required" },
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return NextResponse.json(
        { error: "correctIndex must match an option" },
        { status: 400 }
      );
    }

    const max = await prisma.question.aggregate({
      where: { lessonId },
      _max: { order: true },
    });

    const question = await prisma.question.create({
      data: {
        lessonId,
        prompt,
        type: String(body.type || "multiple_choice"),
        options,
        correctIndex,
        explanation: body.explanation ? String(body.explanation) : null,
        order: Number(body.order) || (max._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Admin question create error:", error);
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
    if (rest.prompt !== undefined) data.prompt = String(rest.prompt);
    if (rest.type !== undefined) data.type = String(rest.type);
    if (rest.options !== undefined) {
      const options = Array.isArray(rest.options)
        ? rest.options.map((o: unknown) => String(o))
        : [];
      data.options = options;
      if (rest.correctIndex !== undefined) {
        const idx = Number(rest.correctIndex);
        if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
          return NextResponse.json(
            { error: "correctIndex must match an option" },
            { status: 400 }
          );
        }
        data.correctIndex = idx;
      }
    } else if (rest.correctIndex !== undefined) {
      data.correctIndex = Number(rest.correctIndex);
    }
    if (rest.explanation !== undefined)
      data.explanation = rest.explanation || null;
    if (rest.order !== undefined) data.order = Number(rest.order) || 0;

    const question = await prisma.question.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ question });
  } catch (error) {
    console.error("Admin question update error:", error);
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
    await prisma.question.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Question deleted" });
  } catch (error) {
    console.error("Admin question delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
