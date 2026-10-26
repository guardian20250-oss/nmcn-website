import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageCreatorStats, getStatsViewer, rowInScope } from "@/lib/creator-stats-access";
import { parseBackstageExport, normalizeHandle, STATS_CONFIG, isPeriodType, periodLabel } from "@/lib/creator-stats";
import { sendStatsUploadedCard } from "@/lib/stats-notify";

export const runtime = "nodejs";

// Who may use this route: owner/co-owner (admin), managers and team leads.
// Each uploader only ever imports rows inside their own scope.
async function requireViewer(request: NextRequest) {
  const viewer = await getStatsViewer(request);
  if (viewer.status !== 200) {
    return { error: NextResponse.json({ error: viewer.status === 401 ? "Unauthorized" : "Forbidden" }, { status: viewer.status }) };
  }
  return { viewer };
}

// GET: upload history (owner: all uploads + audit log · others: their own uploads)
export async function GET(request: NextRequest) {
  const { viewer, error } = await requireViewer(request);
  if (!viewer) return error;
  const isOwner = canManageCreatorStats(viewer.staff.role);

  const [snapshots, audit, accountsWithoutHandle] = await Promise.all([
    prisma.creatorStatSnapshot.findMany({
      where: isOwner ? {} : { uploadedById: viewer.staff.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, exportedAt: true, periodType: true, originalFilename: true, uploaderRole: true, createdAt: true,
        rowCount: true, matchedCount: true, skippedOutOfScope: true, duplicateCount: true, unmatchedCount: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    }),
    isOwner ? prisma.creatorStatAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }) : Promise.resolve([]),
    isOwner
      ? prisma.creatorAccount.count({ where: { status: "active", OR: [{ tiktokHandle: null }, { tiktokHandle: "" }] } })
      : Promise.resolve(0),
  ]);
  return NextResponse.json({ snapshots, audit, accountsWithoutHandle, canSeeAudit: isOwner });
}

// POST multipart/form-data:
//   file=<.xlsx>, periodType=weekly|monthly, action=preview|import,
//   unlink=<JSON array of Creator IDs to leave unlinked>
export async function POST(request: NextRequest) {
  const { viewer, error } = await requireViewer(request);
  if (!viewer) return error;
  const { staff, scope, access } = viewer;
  const isOwner = scope === "all";

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload" }, { status: 400 });
  }
  const file = form.get("file");
  const action = String(form.get("action") || "preview");
  const periodType = String(form.get("periodType") || "");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: "Please upload the .xlsx export from LIVE Backstage" }, { status: 400 });
  if (file.size > STATS_CONFIG.maxUploadBytes) return NextResponse.json({ error: "File is too large (max 10 MB)" }, { status: 400 });
  if (!isPeriodType(periodType)) return NextResponse.json({ error: "Choose an upload type: Weekly or End of Month" }, { status: 400 });

  let parsed;
  try {
    parsed = parseBackstageExport(Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not read file" }, { status: 400 });
  }
  const exportedAt = parsed.exportedAt ?? new Date();

  // 1) Scope filter FIRST: rows outside the uploader's scope are dropped here
  //    and never stored or returned.
  const inScope = parsed.rows.filter(r => rowInScope(scope, access, r));
  const skippedOutOfScope = parsed.rows.length - inScope.length;

  // 2) Merge: skip creators already on file for this export date.
  const existing = await prisma.creatorStat.findMany({
    where: { exportedAt, backstageCreatorId: { in: inScope.map(r => r.backstageCreatorId) } },
    select: { backstageCreatorId: true },
  });
  const existingIds = new Set(existing.map(e => e.backstageCreatorId));
  const fresh = inScope.filter(r => !existingIds.has(r.backstageCreatorId));
  const duplicateCount = inScope.length - fresh.length;

  // 3) Link rows to creator accounts. The Backstage Creator ID is stable, so a
  //    previous link wins; otherwise match by TikTok handle (case-insensitive, no @).
  const accounts = await prisma.creatorAccount.findMany({ select: { id: true, name: true, email: true, tiktokHandle: true, status: true } });
  const byHandle = new Map<string, typeof accounts>();
  for (const a of accounts) {
    const h = normalizeHandle(a.tiktokHandle);
    if (h) byHandle.set(h, [...(byHandle.get(h) || []), a]);
  }
  const prior = await prisma.creatorStat.findMany({
    where: { creatorAccountId: { not: null } },
    select: { backstageCreatorId: true, creatorAccountId: true },
    orderBy: { exportedAt: "desc" },
    distinct: ["backstageCreatorId"],
  });
  const priorById = new Map(prior.map(p => [p.backstageCreatorId, p.creatorAccountId!]));
  const priorByAccount = new Map(prior.map(p => [p.creatorAccountId!, p.backstageCreatorId]));
  const accountById = new Map(accounts.map(a => [a.id, a]));

  let unlink = new Set<string>();
  try {
    const raw = form.get("unlink");
    if (raw) unlink = new Set((JSON.parse(String(raw)) as unknown[]).map(String));
  } catch { /* ignore */ }

  const rows = fresh.map(r => {
    const priorAccount = accountById.get(priorById.get(r.backstageCreatorId) ?? -1);
    const candidates = byHandle.get(r.username) || [];
    let match: (typeof accounts)[number] | null = null;
    let conflict: string | null = null;
    if (priorAccount) {
      match = priorAccount;
      if (candidates.some(c => c.id !== priorAccount.id)) conflict = "Another account also uses this TikTok handle; kept the previous link";
    } else if (candidates.length > 1) {
      conflict = "Several accounts use this TikTok handle; not linked";
    } else if (candidates.length === 1) {
      const other = priorByAccount.get(candidates[0].id);
      if (other && other !== r.backstageCreatorId) conflict = "Account is already linked to a different Creator ID; not linked";
      else match = candidates[0];
    }
    return { row: r, match, conflict, linkedBy: priorAccount ? "creatorId" : match ? "handle" : null };
  });
  const linkedCount = rows.filter(r => r.match && !unlink.has(r.row.backstageCreatorId)).length;
  const counts = {
    total: parsed.rows.length,
    toImport: rows.length,
    skippedOutOfScope,
    duplicateCount,
    unmatchedCount: rows.length - linkedCount,
    linkedCount,
  };
  const summary = `${periodLabel(periodType)} · ${file.name}: ${counts.toImport} to import, ${skippedOutOfScope} out of scope, ${duplicateCount} already on file, ${counts.unmatchedCount} unmatched`;

  if (action === "preview") {
    await prisma.creatorStatAuditLog.create({
      data: { action: "preview", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Previewed ${summary}` },
    });
    return NextResponse.json({
      filename: file.name,
      exportedAt,
      periodType,
      warnings: parsed.warnings,
      counts,
      // In-scope rows only. Out-of-scope rows are reported as a count above.
      rows: rows.map(({ row, match, conflict, linkedBy }) => ({
        backstageCreatorId: row.backstageCreatorId,
        username: row.username,
        teamLead: row.teamLead,
        diamondsL30D: row.diamondsL30D,
        validDaysL30D: row.validDaysL30D,
        conflict,
        linkedBy,
        match: match ? { id: match.id, name: match.name, email: isOwner ? match.email : null } : null,
      })),
    });
  }

  if (action !== "import") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (!rows.length) {
    return NextResponse.json(
      { error: skippedOutOfScope === parsed.rows.length ? "None of the rows in this export belong to your team." : "Everything in your scope from this export is already on file.", counts },
      { status: 409 }
    );
  }

  const data = rows.map(({ row, match }) => ({
    ...row,
    exportedAt,
    periodType,
    creatorAccountId: match && !unlink.has(row.backstageCreatorId) ? match.id : null,
  }));

  const snapshot = await prisma.$transaction(async tx => {
    const snap = await tx.creatorStatSnapshot.create({
      data: {
        exportedAt, periodType, originalFilename: file.name.slice(0, 200), uploaderRole: staff.role, uploadedById: staff.id,
        rowCount: data.length, matchedCount: linkedCount, skippedOutOfScope, duplicateCount, unmatchedCount: counts.unmatchedCount,
      },
    });
    const res = await tx.creatorStat.createMany({ data: data.map(d => ({ ...d, snapshotId: snap.id })), skipDuplicates: true });
    await tx.creatorStatAuditLog.create({
      data: {
        action: "import", adminId: staff.id, adminEmail: staff.email, snapshotId: snap.id,
        details: `[${staff.role}] Imported ${summary}; ${linkedCount} linked, ${unlink.size} manually unlinked`,
      },
    });
    if (res.count !== data.length) await tx.creatorStatSnapshot.update({ where: { id: snap.id }, data: { rowCount: res.count } });
    return { ...snap, rowCount: res.count };
  }, { timeout: 30_000 });

  // Creators-channel card: owner/co-owner import = the master file → ONE
  // combined card; team lead/manager import → one card naming their team(s).
  // Never throws — a Discord hiccup must not fail the committed import.
  const teamLeads = [...new Set(rows.map(r => r.row.teamLead).filter((t): t is string => Boolean(t)))];
  const notify = await sendStatsUploadedCard({
    periodType,
    teamLeads,
    isMasterFile: isOwner,
    importedCount: snapshot.rowCount,
    uploadedBy: staff.name,
  });

  return NextResponse.json({ ok: true, snapshotId: snapshot.id, counts: { ...counts, imported: snapshot.rowCount }, notify });
}

// DELETE ?id=<snapshotId>: owners can remove any upload; others only their own.
export async function DELETE(request: NextRequest) {
  const { viewer, error } = await requireViewer(request);
  if (!viewer) return error;
  const { staff } = viewer;
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const snap = await prisma.creatorStatSnapshot.findUnique({
    where: { id },
    select: { id: true, originalFilename: true, exportedAt: true, periodType: true, uploadedById: true },
  });
  if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCreatorStats(staff.role) && snap.uploadedById !== staff.id) {
    return NextResponse.json({ error: "You can only delete your own uploads" }, { status: 403 });
  }
  await prisma.$transaction([
    prisma.creatorStatSnapshot.delete({ where: { id } }),
    prisma.creatorStatAuditLog.create({
      data: {
        action: "delete", adminId: staff.id, adminEmail: staff.email, snapshotId: id,
        details: `[${staff.role}] Deleted ${periodLabel(snap.periodType)} upload ${snap.originalFilename} (exported ${snap.exportedAt.toISOString()})`,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
