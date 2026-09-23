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
  role: string;
  status: string;
  independentCreator: boolean;
}

export interface CreatorAccountPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  independentCreator: boolean;
  mustChangePassword?: boolean;
}

const VALID_ROLES = ["admin", "manager", "team_lead", "scout", "battle_coordinator"] as const;
type StaffRole = (typeof VALID_ROLES)[number];

export async function verifyAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as StaffRole,
    mustChangePassword: admin.mustChangePassword,
  };
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

export function generateCreatorToken(payload: CreatorPayload | CreatorAccountPayload) {
  return jwt.sign(payload, CREATOR_JWT_SECRET, { expiresIn: "30d" });
}

export function verifyCreatorToken(token: string): CreatorPayload | CreatorAccountPayload | null {
  try {
    return jwt.verify(token, CREATOR_JWT_SECRET) as CreatorPayload | CreatorAccountPayload;
  } catch {
    return null;
  }
}

export async function registerCreatorAccount(data: {
  name: string;
  email: string;
  password: string;
  tiktokHandle?: string;
  assignedRole?: string;
  independentCreator?: boolean;
  createdById?: number;
  status?: string;
  mustChangePassword?: boolean;
}): Promise<{ account: any; token: string }> {
  const exists = await prisma.creatorAccount.findUnique({ where: { email: data.email } });
  if (exists) throw new Error("An account with this email already exists");

  const isIndependent = data.assignedRole === "independent_creator" || data.independentCreator;
  const account = await prisma.creatorAccount.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      tiktokHandle: data.tiktokHandle || null,
      status: data.status || (data.createdById ? "active" : isIndependent || data.assignedRole === "creator" ? "active" : "pending"),
      assignedRole: data.assignedRole || "creator",
      independentCreator: isIndependent,
      mustChangePassword: data.mustChangePassword ?? Boolean(data.createdById),
      createdById: data.createdById || null,
    },
  });

  const payload = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.assignedRole,
    status: account.status,
    independentCreator: account.independentCreator,
  };
  const token = generateCreatorToken(payload);
  return { account, token };
}

export async function loginCreatorAccount(email: string, password: string) {
  const account = await prisma.creatorAccount.findUnique({ where: { email } });
  if (!account) return null;

  const valid = await bcrypt.compare(password, account.password);
  if (!valid) return null;

  if (account.status === "pending") {
    return { pending: true, email: account.email, name: account.name, role: account.assignedRole };
  }

  const payload = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.assignedRole,
    status: account.status,
    independentCreator: account.independentCreator,
  };
  const token = generateCreatorToken(payload);
  return {
    account,
    token,
    role: account.assignedRole,
    status: account.status,
    independentCreator: account.independentCreator,
    mustChangePassword: account.mustChangePassword,
  };
}

export async function getCreatorAccountFromRequest(request: NextRequest): Promise<CreatorAccountPayload | null> {
  const token = request.cookies.get("creator-token")?.value;
  if (!token) return null;
  const payload = verifyCreatorToken(token);
  if (!payload) return null;
  const account = await prisma.creatorAccount.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, assignedRole: true, status: true, independentCreator: true, mustChangePassword: true },
  });
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.assignedRole,
    status: account.status,
    independentCreator: account.independentCreator,
    mustChangePassword: account.mustChangePassword,
  };
}

export function getCoursesForRole(role: string, independentCreator: boolean): string[] {
  if (independentCreator) return ["creator"];
  if (role === "creator") return ["creator"];
  if (role === "team_lead") return ["team_lead"];
  if (role === "manager") return ["manager"];
  if (role === "scout") return ["scout"];
  if (role === "battle_coordinator") return ["battle_coordinator"];
  return ["creator"];
}

// ── Admin staff management helpers ────────────────────────────────────────────

export async function createStaffAccount(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  createdById?: number;
}) {
  const exists = await prisma.admin.findUnique({ where: { email: data.email } });
  if (exists) throw new Error("An admin account with this email already exists");

  return prisma.admin.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: data.role,
      mustChangePassword: true,
    },
  });
}

export async function changeAdminPassword(adminId: number, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return prisma.admin.update({
    where: { id: adminId },
    data: {
      password: await hashPassword(newPassword),
      mustChangePassword: false,
    },
    select: { id: true, email: true, name: true, role: true, mustChangePassword: true },
  });
}

export async function changeCreatorPassword(creatorId: number, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return prisma.creatorAccount.update({
    where: { id: creatorId },
    data: {
      password: await hashPassword(newPassword),
      mustChangePassword: false,
    },
    select: { id: true, email: true, name: true },
  });
}

export async function getPendingAccounts() {
  return prisma.creatorAccount.findMany({
    where: { status: "pending" },
    select: { id: true, email: true, name: true, tiktokHandle: true, assignedRole: true, independentCreator: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveAccount(id: number, assignedRole: string) {
  return prisma.creatorAccount.update({
    where: { id },
    data: {
      status: "active",
      assignedRole,
      independentCreator: assignedRole === "independent_creator",
    },
  });
}

export async function rejectAccount(id: number) {
  return prisma.creatorAccount.update({
    where: { id },
    data: { status: "rejected" },
  });
}

export async function getAllAccounts() {
  const pending = await prisma.creatorAccount.findMany({
    where: { status: "pending" },
    select: { id: true, email: true, name: true, tiktokHandle: true, assignedRole: true, independentCreator: true, status: true, createdAt: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const active = await prisma.creatorAccount.findMany({
    where: { status: "active" },
    select: { id: true, email: true, name: true, tiktokHandle: true, assignedRole: true, independentCreator: true, status: true, createdAt: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const rejected = await prisma.creatorAccount.findMany({
    where: { status: "rejected" },
    select: { id: true, email: true, name: true, tiktokHandle: true, assignedRole: true, independentCreator: true, status: true, createdAt: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const staff = await prisma.admin.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return { pending, active, rejected, staff };
}

// ── Staff request helpers ───────────────────────────────────────────────────

export async function getStaffFromRequest(request: NextRequest): Promise<{ id: number; email: string; name: string; role: StaffRole; mustChangePassword: boolean } | null> {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, role: true, mustChangePassword: true },
  });
  if (!admin) return null;
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as StaffRole,
    mustChangePassword: admin.mustChangePassword,
  };
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

export function canViewAllTickets(role: StaffRole): boolean {
  return role === "admin";
}

export function canViewTickets(role: StaffRole): boolean {
  return isStaffRole(role);
}

export function canTransferTickets(role: StaffRole): boolean {
  return role === "admin";
}

export function canDeleteTickets(role: StaffRole): boolean {
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
