# Creator Stats (TikTok LIVE Backstage)

Brings Backstage "Manage creators" export data into the main site.
Main site only. Nothing was added to the Battle Exchange site; the main site's existing Battle Exchange page and nav link are unchanged.

## Who sees what (enforced server-side on every request)

| Role | Page | Sees | Can upload |
|---|---|---|---|
| Creator | `/academy/stats` (My Stats) | **Only their own latest row**: manager/team lead, tier status, days since joining, Diamonds L30D, valid go-LIVE days L30D, LIVE duration L30D, Achieved Star Creator, Star Creator days this month. Met / not met badges for 8 days and 20 hours, plus a Tier 5 (500,000 ◆) note. Never Notes or Invited by. | No |
| Team lead | `/admin/creator-stats` | Creators whose **"Creator Network manager"** column = the team lead's staff email (case-insensitive), **plus any Backstage emails mapped to their account**. All columns, including Notes and Invited by. | Yes, rows for their own team only |
| Manager | `/admin/creator-stats` | Creators of the team leads assigned to them, plus individually assigned creators (and their mapped Backstage emails). All columns, including Notes and Invited by. | Yes, rows in that scope only |
| Owner / co-owner (`admin`) | `/admin/creator-stats` | Everything (all columns incl. Notes and Invited by), totals, leaderboards, search/filter, history, audit log, manager assignments, email mappings, staff creation | Yes, everything |
| Scout / battle coordinator | none | none | No |

**Notes and Invited by are staff-wide** — every role that can open `/admin/creator-stats`
(owner, manager, team lead) sees them. The only people blocked from those two fields
are **creators**, enforced by the `CREATOR_SAFE_SELECT` allowlist on their own page.

The Navbar shows **My Stats** to creators, and **Creator Stats** / **Team Stats** to owners, managers and team leads.

## When the Backstage email doesn't match a staff account

Backstage stores its own "Creator Network manager" email, which is often **different
from the email the person used to sign up on this site**. The Assignments panel lists
these as *"In Backstage data but no team lead account with that email"*.

Map each one to the real staff account and their creators appear under that person
automatically — no per-creator clicking, and nothing is hidden from anyone.

1. Open `/admin/creator-stats` → **Teams & manager assignments**.
2. Next to an unmatched Backstage email, pick the staff account it belongs to.
3. Save. That team lead's scope (and any manager assigned to them) now includes
   those creators on the next request.

Mappings are additive: the original Backstage email rule keeps working alongside them.

### Assigning managers

The assign box runs top to bottom: **1 · team lead → 2 · manager → 3 · creator → Assign**.

- The team lead step is the anchor and is always required. **Owner accounts are
  included** even though the owner's profile does not exist in the Backstage
  export — so managers can be assigned under the owner's account too.
- Step 3 is filtered to creators whose Backstage manager is the selected lead
  (their own email plus any mapped emails).
- Blank creator = the manager covers **everyone** under that lead. Picked
  creator = the manager is assigned to **only that person**.

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
- **Linking also runs outside of uploads.** A creator who sets or changes their TikTok
  handle on `/academy/account` is linked immediately against stats already on file, so
  they never have to wait for the next upload to see their numbers. The stats page also
  re-attempts the link if it finds none.
- Conflicts are flagged and not auto-linked: two accounts with the same handle, or an account already linked to a different Creator ID. This blocks someone from setting their handle to another creator's to see their stats.
- The uploader can untick any suggested link in the preview.

## Config (`src/lib/creator-stats.ts` → `STATS_CONFIG`)

- `validDaysGoal: 8`, `liveHoursGoal: 20` (monthly goals)
- `tierTargets: { 5: 500_000 }`. **TODO:** add the Tier 1–4 cutoffs when known.

## Database

Additive only: 5 new tables (`creator_stat_snapshots`, `creator_stats`,
`creator_stat_audit_logs`, `creator_stat_manager_assignments`,
`creator_stat_email_mappings`). No existing table or column changes. The SQL is in
`prisma/sql/20261025_creator_stats.sql`. The existing Vercel build runs
`prisma db push`, which creates these tables on deploy.

## Upload reminders (Discord)

The site checks for stale uploads and posts to a Discord webhook when a team is
overdue, so nobody has to remember to upload.

- Set `DISCORD_STATS_WEBHOOK` in the project environment variables to your Discord
  webhook URL. Leave it unset to disable reminders entirely.
- `CRON_SECRET` protects the scheduled endpoint; Vercel's cron job sends it
  (the endpoint returns 503 until it is set, and 401 for any other caller).
- The endpoint is `GET /api/cron/stats-reminders`, scheduled daily at 09:00 UTC
  via the `crons` entry in `vercel.json`.
- A team is **overdue** when its newest Backstage export row is older than
  7 days. One message per run lists every overdue team with days since its
  last upload (capped at 20 teams to respect Discord's 2000-char limit).

## Privacy

The repo is public. `*.xlsx`, `*.xls` and `*.csv` are gitignored, so never commit a Backstage export. Uploaded files are parsed in memory and not stored.
