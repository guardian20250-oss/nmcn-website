import { NextRequest, NextResponse } from "next/server";
import { getStaffFromRequest, canManageStaff } from "@/lib/auth";
import { createStaffAccount, getAllAccounts, approveAccount, rejectAccount } from "@/lib/auth";

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
      if (!accountId || !assignedRole) {
        return NextResponse.json({ error: "Account ID and role are required" }, { status: 400 });
      }
      const account = await approveAccount(accountId, assignedRole);
      return NextResponse.json({ account });
    }

    if (action === "rejectAccount") {
      if (!accountId) {
        return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
      }
      const account = await rejectAccount(accountId);
      return NextResponse.json({ account });
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
