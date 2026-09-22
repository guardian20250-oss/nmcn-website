import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canManageStaff, isStaffRole, hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json({
      admins,
      role: staff.role,
      selfId: staff.id,
    });
  } catch (error) {
    console.error("Staff list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const role = body.role;

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
    if (!isStaffRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const admin = await prisma.admin.create({
      data: { email, name, password: hashed, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("Create staff error:", error);
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
    const { id, role, name } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!isStaffRole(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (Number(id) === staff.id && role !== "admin") {
        const adminCount = await prisma.admin.count({ where: { role: "admin" } });
        const self = await prisma.admin.findUnique({
          where: { id: Number(id) },
          select: { role: true },
        });
        if (self?.role === "admin" && adminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot demote the last admin" },
            { status: 400 }
          );
        }
      }
      data.role = role;
    }
    if (name !== undefined) data.name = String(name);

    const admin = await prisma.admin.update({
      where: { id: Number(id) },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
