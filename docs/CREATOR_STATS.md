# Creator Stats (TikTok LIVE Backstage)

Brings Backstage "Manage creators" export data into the main site.
Main site only. Nothing was added to the Battle Exchange site; the main site's existing Battle Exchange page and nav link are unchanged.

## Who sees what (enforced server-side on every request)

| Role | Page | Sees | Can upload |
|---|---|---|---|
| Creator | `/academy/stats` (My Stats) | **Only their own latest row**: manager/team lead, tier status, days since joining, Diamonds L30D, valid go-LIVE days L30D, LIVE duration L30D, Achieved Star Creator, Star Creator days this month. Met / not met badges for 8 days and 20 hours, plus a Tier 5 (500,000 ◆) note. Never Notes or Invited by. | No |
| Team lead | `/admin/creator-stats` | Creators whose **"Creator Network manager"** column = the team lead's staff email (case-insensitive) | Yes, rows for their own team only |
| Manager | `/admin/creator-stats` | Creators of the team leads assigned to them, plus individually assigned creators | Yes, rows in that scope only |
| Owner / co-owner (`admin`) | `/admin/creator-stats` | Everything (all columns incl. Notes and Invited by), totals, leaderboards, search/filter, history, audit log, manager assignments | Yes, everything |
| Scout / battle coordinator | none | none | No |

The Navbar shows **My Stats** to creators, and **Creator Stats** / **Team Stats** to owners, managers and team leads.

## Uploading

1. LIVE Backstage → Manage creators → Export (.xlsx). Team leads can export just their own team.
2. On `/admin/creator-stats`, choose **Upload type** (Weekly or End of Month), choose the file, then click **Preview**.
3. The preview shows the counts **to import / skipped (out of scope) / already on file / not linked to an account**. Out-of-scope creators are never shown or stored.
4. Click **Confirm import**.

How merging works:
- An upload only adds rows for creators **in that file and in the uploader's scope**. Creators not in the file keep their existing stats; nothing is deleted, hidden or marked missing.
- Rows are unique per **(Creator ID, "Exported at")**. Re-uploading the same export is skipped as "already on file".
- Every dashboard row (and the creator page) shows its own **"Stats as of"** date, because partial uploads can have different export times.
- Deleting an upload removes only the rows it added, and those creators fall back to their previous row. Owners can delete any upload; others can delete only their own.
- The audit log records preview, import, delete and assignment actions, with who did it, their role, the upload type and the counts.

## Linking rows to creator accounts

- First time: match the export's username to `CreatorAccount.tiktokHandle` (case-insensitive, `@` and tiktok.com prefix stripped).
- After that, the **Backstage Creator ID** link is kept even if the handle changes.
- Conflicts are flagged and not auto-linked: two accounts with the same handle, or an account already linked to a different Creator ID. This blocks someone from setting their handle to another creator's to see their stats.
- The uploader can untick any suggested link in the preview.

## Config (`src/lib/creator-stats.ts` → `STATS_CONFIG`)

- `validDaysGoal: 8`, `liveHoursGoal: 20` (monthly goals)
- `tierTargets: { 5: 500_000 }`. **TODO:** add the Tier 1–4 cutoffs when known.

## Database

Additive only: 4 new tables (`creator_stat_snapshots`, `creator_stats`,
`creator_stat_audit_logs`, `creator_stat_manager_assignments`). No existing
table or column changes. The SQL is in `prisma/sql/20261025_creator_stats.sql`.
The existing Vercel build runs `prisma db push`, which creates these tables
on deploy.

## Privacy

The repo is public. `*.xlsx`, `*.xls` and `*.csv` are gitignored, so never commit a Backstage export. Uploaded files are parsed in memory and not stored.
