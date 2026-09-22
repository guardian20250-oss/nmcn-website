import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canManageCourses } from "@/lib/auth";

async function requireCourseManager(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return false;
  return canManageCourses(staff.role);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireCourseManager(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(id) },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Admin lesson detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
