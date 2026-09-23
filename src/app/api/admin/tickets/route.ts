import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canManageStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status && status !== "all" ? { status } : {};

    const [tickets, counts] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          handledBy: { select: { id: true, name: true } },
        },
      }),
      prisma.supportTicket.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const statusCounts: Record<string, number> = { open: 0, in_progress: 0, resolved: 0 };
    for (const c of counts) statusCounts[c.status] = c._count;

    return NextResponse.json({ tickets, counts: statusCounts });
  } catch (error) {
    console.error("List tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: { status?: string; handledById?: number } = {};
    if (body.status && ["open", "in_progress", "resolved"].includes(body.status)) {
      data.status = body.status;
      if (body.status !== "open") data.handledById = staff.id;
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        handledBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await prisma.supportTicket.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
