import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCreatorToken, generateCreatorToken, hashPassword } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("creator-token")?.value;
  const payload = token ? verifyCreatorToken(token) : null;
  if (!payload) {
    return NextResponse.json({ user: null });
  }

  try {
    const creator = await prisma.creator.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, tiktokHandle: true },
    });
    return NextResponse.json({ user: creator });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "register") {
      const { email, password, name, tiktokHandle } = body;
      if (!email || !password || !name) {
        return NextResponse.json(
          { error: "Name, email, and password are required" },
          { status: 400 }
        );
      }
      if (String(password).length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const existing = await prisma.creator.findUnique({
        where: { email: String(email).toLowerCase() },
      });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashed = await hashPassword(String(password));
      const creator = await prisma.creator.create({
        data: {
          email: String(email).toLowerCase(),
          password: hashed,
          name: String(name),
          tiktokHandle: tiktokHandle ? String(tiktokHandle) : null,
        },
      });

      const token = generateCreatorToken({
        id: creator.id,
        email: creator.email,
        name: creator.name,
      });

      const response = NextResponse.json({
        message: "Account created",
        user: {
          id: creator.id,
          email: creator.email,
          name: creator.name,
          tiktokHandle: creator.tiktokHandle,
        },
      });
      response.cookies.set("creator-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return response;
    }

    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      const creator = await prisma.creator.findUnique({
        where: { email: String(email).toLowerCase() },
      });
      if (!creator) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const valid = await bcrypt.compare(String(password), creator.password);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const token = generateCreatorToken({
        id: creator.id,
        email: creator.email,
        name: creator.name,
      });

      const response = NextResponse.json({
        message: "Login successful",
        user: {
          id: creator.id,
          email: creator.email,
          name: creator.name,
          tiktokHandle: creator.tiktokHandle,
        },
      });
      response.cookies.set("creator-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ message: "Logged out" });
      response.cookies.set("creator-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Creator auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
