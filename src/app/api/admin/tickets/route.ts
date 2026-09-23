import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getStaffFromRequest,
  canViewAllTickets,
  canViewTickets,
  canTransferTickets,
  canDeleteTickets,
} from "@/lib/auth";

const STATUSES = ["open", "in_progress", "resolved"] as const;

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewTickets(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const scope = canViewAllTickets(staff.role) ? {} : { handledById: staff.id };
    const where = status && status !== "all" ? { ...scope, status } : scope;

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
        where: scope,
        _count: true,
      }),
    ]);

    const statusCounts: Record<string, number> = { open: 0, in_progress: 0, resolved: 0 };
    for (const c of counts) statusCounts[c.status] = c._count;

    return NextResponse.json({
      tickets,
      counts: statusCounts,
      scope: canViewAllTickets(staff.role) ? "all" : "assigned",
      role: staff.role,
    });
  } catch (error) {
    console.error("List tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewTickets(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, handledById: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isAdmin = canViewAllTickets(staff.role);
    if (!isAdmin && existing.handledById !== staff.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: { status?: string; handledById?: number | null } = {};
    if (body.status && STATUSES.includes(body.status)) {
      data.status = body.status;
      if (body.status !== "open") data.handledById = staff.id;
    }

    if (body.handledById !== undefined) {
      if (!canTransferTickets(staff.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const transferId = body.handledById === null || body.handledById === ""
        ? null
        : Number(body.handledById);
      if (transferId !== null) {
        const target = await prisma.admin.findUnique({
          where: { id: transferId },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json({ error: "Transfer target not found" }, { status: 404 });
        }
      }
      data.handledById = transferId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
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
  if (!canDeleteTickets(staff.role)) {
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
