import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  registerCreatorAccount,
  loginCreatorAccount,
  getCreatorAccountFromRequest,
  getCoursesForRole,
  changeCreatorPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, name, email, password, tiktokHandle } = body;

    if (mode === "logout" || body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set("creator-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    if (mode === "changePassword") {
      const account = await getCreatorAccountFromRequest(request);
      if (!account) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const newPassword = String(body.newPassword || "");
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      await changeCreatorPassword(account.id, newPassword);
      return NextResponse.json({ message: "Password updated" });
    }

    if (mode === "updateProfile") {
      const account = await getCreatorAccountFromRequest(request);
      if (!account) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const tiktokHandle = String(body.tiktokHandle || "").trim();

      if (!name || !email) {
        return NextResponse.json(
          { error: "Name and email are required" },
          { status: 400 }
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Please enter a valid email address" },
          { status: 400 }
        );
      }

      const dup = await prisma.creatorAccount.findFirst({
        where: { email, NOT: { id: account.id } },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      await prisma.creatorAccount.update({
        where: { id: account.id },
        data: { name, email, tiktokHandle: tiktokHandle || null },
      });

      return NextResponse.json({
        message: "Profile updated",
        user: {
          id: account.id,
          name,
          email,
          tiktokHandle: tiktokHandle || null,
          role: account.role,
          status: account.status,
        },
      });
    }

    if (mode === "register") {
      if (!name || !email || !password) {
        return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
      }

      const result = await registerCreatorAccount({
        name,
        email: email.toLowerCase(),
        password,
        tiktokHandle: tiktokHandle || "",
        assignedRole: "creator",
        independentCreator: false,
        status: "pending",
      });

      const response = NextResponse.json({
        user: {
          id: result.account.id,
          email: result.account.email,
          name: result.account.name,
          role: result.account.assignedRole,
          status: result.account.status,
          independentCreator: result.account.independentCreator,
        },
        token: result.token,
        pending: result.account.status === "pending",
      });
      const token = result.token as string;
      response.cookies.set("creator-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return response;
    }

    if (mode === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const result = await loginCreatorAccount(email.toLowerCase(), password);
      if (!result) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      if (result.pending) {
        return NextResponse.json({
          user: { id: null, email: result.email, name: result.name, role: result.role, status: "pending", independentCreator: false },
          token: null,
          pending: true,
        });
      }

      const account = result.account;
      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 500 });
      }
      const courses = getCoursesForRole(result.role, result.independentCreator ?? false);
      const response = NextResponse.json({
        user: {
          id: account.id,
          email: account.email,
          name: account.name,
          role: result.role,
          status: result.status,
          independentCreator: result.independentCreator ?? false,
          mustChangePassword: result.mustChangePassword ?? false,
        },
        token: result.token,
        pending: false,
        courses,
      });
      const token2 = result.token as string;
      response.cookies.set("creator-token", token2, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Academy auth error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const account = await getCreatorAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ user: null });
    }
    let tiktokHandle: string | null = null;
    let createdAt: string | null = null;
    try {
      const row = await prisma.creatorAccount.findUnique({
        where: { id: account.id },
        select: { tiktokHandle: true, createdAt: true },
      });
      if (row) {
        tiktokHandle = row.tiktokHandle;
        createdAt = row.createdAt.toISOString();
      }
    } catch {
      // non-fatal
    }
    return NextResponse.json({
      user: {
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role,
        status: account.status,
        independentCreator: account.independentCreator,
        mustChangePassword: account.mustChangePassword ?? false,
        tiktokHandle,
        createdAt,
      },
      courses: getCoursesForRole(account.role, account.independentCreator),
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
