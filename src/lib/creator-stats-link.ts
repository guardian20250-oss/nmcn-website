// Linking a creator account to its stat rows OUTSIDE of an upload.
//
// Historically the only chance to link was during an import, so a creator who
// set or changed their TikTok handle afterwards stayed invisible until the next
// weekly upload. This closes that gap: linking now runs whenever the handle is
// saved, and the stats page re-attempts it when a creator has no rows.
//
// The hijack protections from the upload path are preserved:
//   * a Creator ID already owned by a different account is never claimed;
//   * an account already bound to one Creator ID cannot claim another.
import { prisma } from "./prisma";
import { normalizeHandle } from "./creator-stats";

export type LinkStatus = "no_handle" | "no_rows" | "linked" | "already" | "conflict" | "bound_elsewhere";

export interface LinkResult {
  linked: number;
  status: LinkStatus;
}

export async function linkCreatorStatsByHandle(
  accountId: number,
  handle: string | null | undefined
): Promise<LinkResult> {
  const h = normalizeHandle(handle);
  if (!h) return { linked: 0, status: "no_handle" };

  // If this account is already bound to a Creator ID, that binding wins.
  const bound = await prisma.creatorStat.findFirst({
    where: { creatorAccountId: accountId },
    orderBy: [{ exportedAt: "desc" }, { id: "desc" }],
    select: { backstageCreatorId: true },
  });

  const rows = await prisma.creatorStat.findMany({
    where: { username: h },
    select: { backstageCreatorId: true, creatorAccountId: true },
  });
  if (!rows.length) return { linked: 0, status: "no_rows" };

  // One owner per Creator ID: a non-null link anywhere wins over a null one.
  const ownerById = new Map<string, number | null>();
  for (const r of rows) {
    const prev = ownerById.get(r.backstageCreatorId);
    if (prev === undefined || r.creatorAccountId !== null) {
      ownerById.set(r.backstageCreatorId, r.creatorAccountId);
    }
  }

  const candidates: string[] = [];
  let conflict = false;
  let boundElsewhere = false;

  for (const [id, owner] of ownerById) {
    if (bound && bound.backstageCreatorId !== id) {
      boundElsewhere = true;
      continue;
    }
    if (owner !== null && owner !== accountId) {
      conflict = true;
      continue;
    }
    candidates.push(id);
  }

  if (!candidates.length) {
    return { linked: 0, status: conflict ? "conflict" : boundElsewhere ? "bound_elsewhere" : "already" };
  }

  const res = await prisma.creatorStat.updateMany({
    where: { username: h, backstageCreatorId: { in: candidates }, creatorAccountId: null },
    data: { creatorAccountId: accountId },
  });

  return { linked: res.count, status: res.count > 0 ? "linked" : "already" };
}
