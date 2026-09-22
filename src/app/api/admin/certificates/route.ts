import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim();
    const courseSlug = searchParams.get("courseSlug")?.trim();
    const name = searchParams.get("name")?.trim();
    const take = Math.min(Number(searchParams.get("take")) || 100, 200);

    if (code) {
      const certificate = await prisma.certificate.findFirst({
        where: { code: { equals: code.toUpperCase(), mode: "insensitive" } },
        include: {
          course: { select: { title: true, slug: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });
      if (!certificate) {
        return NextResponse.json(
          { error: "No certificate matches this code", certificate: null },
          { status: 404 }
        );
      }
      return NextResponse.json({ certificate, match: true });
    }

    const certificates = await prisma.certificate.findMany({
      where: {
        ...(courseSlug ? { course: { slug: courseSlug } } : {}),
        ...(name
          ? {
              learnerName: { contains: name, mode: "insensitive" as const },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        course: { select: { title: true, slug: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    const courses = await prisma.course.findMany({
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ certificates, courses });
  } catch (error) {
    console.error("Admin certificates fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
