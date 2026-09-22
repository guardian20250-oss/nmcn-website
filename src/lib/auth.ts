import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "nmcn-admin-secret-key-change-in-production";
const CREATOR_JWT_SECRET = process.env.CREATOR_JWT_SECRET || "nmcn-creator-secret-key-change-in-production";

export interface AdminPayload {
  id: number;
  email: string;
}

export interface CreatorPayload {
  id: number;
  email: string;
  name: string;
}

const VALID_ROLES = ["admin", "manager", "team_lead", "scout", "battle_coordinator"] as const;
type StaffRole = (typeof VALID_ROLES)[number];

export async function verifyAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return null;

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role as StaffRole };
}

export function generateToken(payload: AdminPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// ── Creator (Academy) auth ──────────────────────────────────────────────────

export function generateCreatorToken(payload: CreatorPayload) {
  return jwt.sign(payload, CREATOR_JWT_SECRET, { expiresIn: "30d" });
}

export function verifyCreatorToken(token: string): CreatorPayload | null {
  try {
    return jwt.verify(token, CREATOR_JWT_SECRET) as CreatorPayload;
  } catch {
    return null;
  }
}

// ── Staff request helpers ───────────────────────────────────────────────────

export async function getStaffFromRequest(request: NextRequest): Promise<{ id: number; email: string; name: string; role: StaffRole } | null> {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!admin) return null;
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role as StaffRole };
}

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && VALID_ROLES.includes(role as StaffRole);
}

export function canManageCourses(role: StaffRole): boolean {
  return role === "admin" || role === "manager" || role === "team_lead";
}

export function canManageStaff(role: StaffRole): boolean {
  return role === "admin";
}

export function canViewCreatorDashboard(role: StaffRole): boolean {
  return role === "admin" || role === "manager" || role === "team_lead";
}

export function canCreateAcademyAccount(role: StaffRole): boolean {
  return role === "admin" || role === "manager" || role === "team_lead" || role === "scout";
}

export function canManageBattleExchange(role: StaffRole): boolean {
  return role === "admin" || role === "manager" || role === "battle_coordinator";
}
