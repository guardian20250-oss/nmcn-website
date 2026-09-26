import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canManageStaff } from "@/lib/auth";
import {
  createStaffAccount,
  getAllAccounts,
  approveAccount,
  rejectAccount,
  updateStaffAccount,
  deleteStaffAccount,
  updateCreatorAccount,
  deleteCreatorAccount,
  resetCreatorPassword,
  resetStaffPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, name, email, password, role, accountId, assignedRole } = body;

    if (action === "createStaff") {
      if (!name || !email || !password || !role) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
      }

      const account = await createStaffAccount({ name, email, password, role, createdById: staff.id });
      return NextResponse.json({ staff: account });
    }

    if (action === "approveAccount") {
      const id = Number(accountId);
      if (!id || !assignedRole) {
        return NextResponse.json({ error: "Account ID and role are required" }, { status: 400 });
      }
      const account = await approveAccount(id, String(assignedRole));
      return NextResponse.json({ account });
    }

    if (action === "rejectAccount") {
      const id = Number(accountId);
      if (!id) {
        return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
      }
      const account = await rejectAccount(id);
      return NextResponse.json({ account });
    }

    if (action === "updateStaff") {
      const id = Number(body.id);
      if (!id) return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
      if (id === staff.id && body.role && body.role !== staff.role) {
        return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
      }
      const updated = await updateStaffAccount(id, {
        name: body.name,
        email: body.email,
        role: body.role,
        password: body.password || undefined,
      });
      return NextResponse.json({ staff: updated });
    }

    if (action === "deleteStaff") {
      const id = Number(body.id);
      if (!id) return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
      if (id === staff.id) {
        return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
      }
      await deleteStaffAccount(id);
      return NextResponse.json({ ok: true });
    }

    if (action === "updateAccount") {
      const id = Number(body.id);
      if (!id) return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
      const updated = await updateCreatorAccount(id, {
        name: body.name,
        email: body.email,
        tiktokHandle: body.tiktokHandle,
        assignedRole: body.assignedRole,
        status: body.status,
        independentCreator: body.independentCreator,
        password: body.password,
      });
      return NextResponse.json({ account: updated });
    }

    if (action === "deleteAccount") {
      const id = Number(body.id);
      if (!id) return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
      await deleteCreatorAccount(id);
      return NextResponse.json({ ok: true });
    }

    if (action === "resetCreatorPassword") {
      const id = Number(body.id);
      if (!id) return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
      const result = await resetCreatorPassword(id, staff.id);
      return NextResponse.json({ account: result.account, tempPassword: result.tempPassword });
    }

    if (action === "resetStaffPassword") {
      const id = Number(body.id);
      if (!id) return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
      if (id === staff.id) {
        return NextResponse.json({ error: "You cannot reset your own password" }, { status: 400 });
      }
      const result = await resetStaffPassword(id, staff.id);
      return NextResponse.json({ account: result.account, tempPassword: result.tempPassword });
    }

    if (action === "searchAccounts") {
      const email = body.email ? String(body.email).toLowerCase().trim() : "";
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      // Search CreatorAccount, Creator, and JoinApplication models
      const [creatorAccount, creator, joinApplication] = await Promise.all([
        prisma.creatorAccount.findUnique({ where: { email } }),
        prisma.creator.findUnique({ where: { email } }),
        prisma.joinApplication.findFirst({ where: { email } }),
      ]);
      return NextResponse.json({
        creatorAccount,
        creator,
        joinApplication,
        found: !!creatorAccount || !!creator || !!joinApplication,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin staff accounts error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const accounts = await getAllAccounts();
    return NextResponse.json({ accounts, role: staff.role });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
