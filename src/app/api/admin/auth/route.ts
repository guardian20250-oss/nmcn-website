import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, generateToken, changeAdminPassword, getStaffFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set("admin-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    if (body.action === "changePassword") {
      const staff = await getStaffFromRequest(request);
      if (!staff) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const password = String(body.password || "");
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      await changeAdminPassword(staff.id, password);
      return NextResponse.json({ message: "Password updated" });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const admin = await verifyAdmin(email, password);
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = generateToken({ id: admin.id, email: admin.email });

    const response = NextResponse.json({
      message: "Login successful",
      name: admin.name,
      mustChangePassword: admin.mustChangePassword,
    });
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
