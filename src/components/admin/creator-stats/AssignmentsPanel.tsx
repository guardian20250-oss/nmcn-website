"use client";

// Teams, manager assignments, the full roster, profile↔account linking,
// hide/restore creators, and adding a team lead or manager.
// Moved out of the dashboard into the backend management page.
import { useEffect, useState } from "react";
import { Users, Trash2, Pencil, UserX, RotateCcw } from "lucide-react";
import { fmtDate, type Assignments } from "./shared";

export default function AssignmentsPanel() {
  const [asg, setAsg] = useState<Assignments | null>(null);
  // Assign flow: 1 team lead → 2 manager/scout → 3 multi-select creators.
  const [assign, setAssign] = useState({ teamLeadId: "", managerId: "", scoutId: "" });
  const [picked, setPicked] = useState<string[]>([]); // selected creator ids
  const [creatorQuery, setCreatorQuery] = useState("");
  const [editId, setEditId] = useState<number | null>(null); // roster row being edited
  const [editLeadId, setEditLeadId] = useState<number | null>(null); // lead card being edited
  const [linkForm, setLinkForm] = useState({ accountId: "", creatorId: "" });
  const [linkMsg, setLinkMsg] = useState("");
  const [version, setVersion] = useState(0);
  // backstageEmail -> chosen staff id, for the "unmatched" list
  const [mapChoice, setMapChoice] = useState<Record<string, string>>({});
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", role: "team_lead" });
  const [staffMsg, setStaffMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/creator-stats/assignments").then(r => (r.ok ? r.json() : null)).then(d => alive && d && setAsg(d)).catch(() => {});
    return () => { alive = false; };
  }, [version]);
  const reload = () => setVersion(v => v + 1);

  // One request: put these managers/scouts on that team and attach these creators.
  const save = async () => {
    if (!assign.teamLeadId || (!assign.managerId && !assign.scoutId)) return;
    const assigneeIds = [assign.managerId, assign.scoutId].filter(Boolean).map(Number);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/creator-stats/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamLeadId: Number(assign.teamLeadId), assigneeIds, backstageCreatorIds: picked }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Failed"); return; }
      setPicked([]);
      reload();
    } catch { alert("Network error"); } finally { setBusy(false); }
  };
  const remove = async (id: number) => { await fetch(`/api/admin/creator-stats/assignments?id=${id}`, { method: "DELETE" }); setEditId(null); setVersion(v => v + 1); };

  // Owner: remove a departed creator from every stats page (hide flag — no
  // stats deleted, future uploads skip them) or bring them back.
  const hideCreator = async (cid: string, username: string) => {
    if (!confirm(`Remove @${username} from the stats pages? Their stats stay saved but hidden everywhere (including their own My Stats), and future uploads won't bring them back. You can restore them here.`)) return;
    const res = await fetch("/api/admin/creator-stats/assignments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hideCreator", backstageCreatorId: cid }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Could not remove that creator"); return; }
    reload();
  };
  const unhideCreator = async (cid: string) => {
    await fetch("/api/admin/creator-stats/assignments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unhideCreator", backstageCreatorId: cid }),
    });
    reload();
  };

  // Owner: change someone's role (manager ↔ scout ↔ team lead) from the roster.
  const setRole = async (adminId: number, role: string) => {
    const res = await fetch("/api/admin/creator-stats/assignments", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setRole", adminId, role }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Could not change role"); return; }
    setEditId(null); reload();
  };

  // Move a creator row to a different profile (someone left, someone joined).
  const reassign = async (id: number, cid: string) => {
    if (!cid) return;
    const res = await fetch("/api/admin/creator-stats/assignments", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, backstageCreatorId: cid }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Could not move that creator"); return; }
    setEditId(null); reload();
  };

  // Profile ↔ account: bind one of the 162 Backstage profiles to a site account.
  const linkProfile = async () => {
    if (!linkForm.accountId || !linkForm.creatorId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/creator-stats/assignments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "linkProfile", creatorAccountId: Number(linkForm.accountId), backstageCreatorId: linkForm.creatorId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setLinkMsg(d.error || "Could not link that profile"); return; }
      setLinkMsg(`Linked @${d.username} → ${d.account}`);
      setLinkForm({ accountId: "", creatorId: "" });
      reload();
    } catch { setLinkMsg("Network error"); } finally { setBusy(false); }
  };
  const unlinkProfile = async (cid: string) => {
    const res = await fetch("/api/admin/creator-stats/assignments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlinkProfile", backstageCreatorId: cid }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Could not unlink"); return; }
    setLinkMsg("Profile unlinked from its account");
    reload();
  };

  // Link a Backstage "Creator Network manager" email to a real staff account.
  // Fixes the case where Backstage holds a different address than the one the
  // person signed up with, so their creators never matched them.
  const linkEmail = async (backstageEmail: string) => {
    const adminId = Number(mapChoice[backstageEmail]);
    if (!adminId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/creator-stats/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backstageEmail, adminId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Could not link that email"); return; }
      setMapChoice(c => { const n = { ...c }; delete n[backstageEmail]; return n; });
      reload();
    } finally { setBusy(false); }
  };

  const unlinkEmail = async (id: number) => {
    await fetch(`/api/admin/creator-stats/assignments?mappingId=${id}`, { method: "DELETE" });
    reload();
  };

  // Shortcut so an owner never has to leave this page to add a team lead or
  // manager. Uses the same /api/admin/staff/accounts flow as Staff → Accounts.
  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password) return;
    setBusy(true); setStaffMsg("");
    try {
      const res = await fetch("/api/admin/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createStaff", ...staffForm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStaffMsg(data.error || "Could not create that account"); return; }
      setStaffMsg(`Created ${staffForm.name.trim()} — they can sign in with ${staffForm.email.trim()}.`);
      setStaffForm({ name: "", email: "", password: "", role: "team_lead" });
      reload();
    } catch { setStaffMsg("Network error"); } finally { setBusy(false); }
  };

  // Step 3 list: ALL profiles from the data sheet (162), filterable — nothing
  // is hidden because of the selected lead.
  const q = creatorQuery.trim().toLowerCase();
  const shownCreators = (asg?.creators || []).filter(
    c => !q || c.username.toLowerCase().includes(q) || (c.teamLead || "").toLowerCase().includes(q)
  );
  const toggleCreator = (id: string) =>
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  // Only the owner can flip roles; leads and managers can still remove rows
  // and move creators (enforced server-side too).
  const canEditAll = asg?.viewerRole === "admin";

  return (
    <section className="card mt-6 p-6">
      <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-semibold text-white"><Users className="h-5 w-5 text-nmcn-gold" /> Teams &amp; manager assignments</h2>
      <p className="mb-4 text-sm text-nmcn-muted">
        Pick a team lead, then the manager and/or scout assigned to them, then tick any number of creators
        (all {asg?.creators.length ?? "162"} profiles from the data sheet are listed) and assign in one go.
        Everyone on a team can be edited below — change a role, move someone, or remove them completely.
      </p>
      {asg && (
        <>
          <div className="mb-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-nmcn-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Team leads · creators on file</p>
              <ul className="space-y-1">
                {asg.teamLeads.map(t => (
                  <li key={t.id} className="flex justify-between gap-2">
                    <span className="text-white">
                      {t.name} <span className="text-nmcn-muted">{t.email}</span>
                      {t.mappedBackstageEmails.length > 0 && (
                        <span className="block text-[11px] text-nmcn-blue">
                          Backstage: {t.mappedBackstageEmails.join(", ")}
                        </span>
                      )}
                    </span>
                    <span className="text-nmcn-gold">{t.creators}</span>
                  </li>
                ))}
                {asg.teamLeads.length === 0 && <li className="text-nmcn-muted">No team lead staff accounts yet.</li>}
              </ul>

              {/* Backstage emails matching no staff account: map one onto a real person. */}
              {asg.unmatchedTeamLeads.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-400/30 p-3">
                  <p className="mb-2 text-xs font-semibold text-amber-300">
                    In Backstage data but no team lead account with that email
                  </p>
                  <ul className="space-y-2">
                    {asg.unmatchedTeamLeads.map(u => (
                      <li key={u.value} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-nmcn-text">{u.value} ({u.count})</span>
                        <select
                          className="input min-w-[160px] flex-1 text-xs"
                          value={mapChoice[u.value] || ""}
                          onChange={e => setMapChoice(c => ({ ...c, [u.value]: e.target.value }))}
                        >
                          <option value="">Assign to…</option>
                          {[...asg.teamLeads, ...asg.managers, ...asg.scouts].map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                          ))}
                        </select>
                        <button
                          className="btn-gold whitespace-nowrap px-2 py-1 text-xs disabled:opacity-50"
                          disabled={busy || !mapChoice[u.value]}
                          onClick={() => linkEmail(u.value)}
                        >
                          Link
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {asg.mappings.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Linked Backstage emails</p>
                  <ul className="divide-y divide-nmcn-border/40 text-xs">
                    {asg.mappings.map(m => (
                      <li key={m.id} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-nmcn-text">
                          {m.backstageEmail} → <span className="text-white">{m.admin.name}</span>
                        </span>
                        <button
                          className="text-nmcn-muted hover:text-red-400"
                          onClick={() => unlinkEmail(m.id)}
                          aria-label={`Unlink ${m.backstageEmail}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2 rounded-lg border border-nmcn-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                Assign to a team · 1 lead → 2 manager/scout → 3 creators
              </p>

              {/* 1 — Team lead (the anchor). Owner accounts are included even
                  when their profile does not exist in the Backstage export. */}
              <select
                className="input text-sm"
                value={assign.teamLeadId}
                onChange={e => setAssign(a => ({ ...a, teamLeadId: e.target.value }))}
              >
                <option value="">1 · Team lead…</option>
                {asg.teamLeads.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role === "admin" ? "owner" : `${t.creators} creators`})
                  </option>
                ))}
              </select>

              {/* 2 — Manager and scout each get their own section/dropdown. */}
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-nmcn-muted">
                  2 · Manager
                  <select
                    className="input mt-1 block text-sm"
                    value={assign.managerId}
                    onChange={e => setAssign(a => ({ ...a, managerId: e.target.value }))}
                  >
                    <option value="">Manager…</option>
                    {asg.managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </label>
                <label className="text-xs text-nmcn-muted">
                  2 · Scout section
                  <select
                    className="input mt-1 block text-sm"
                    value={assign.scoutId}
                    onChange={e => setAssign(a => ({ ...a, scoutId: e.target.value }))}
                  >
                    <option value="">Scout…</option>
                    {asg.scouts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              </div>

              {/* 2b — Everyone else: promote to manager/scout so the two
                  dropdowns above can offer them. Owner-only (setRole is), and
                  it reloads, so the person pops straight into the list above. */}
              {canEditAll && (asg.others?.length ?? 0) > 0 && (
                <div className="rounded-lg border border-nmcn-border p-2">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-nmcn-muted">
                    Not assignable yet — promote to use above ({asg.others.length})
                  </p>
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {asg.others.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-white" title={p.email}>{p.name}</span>
                        <span
                          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                            p.role === "team_lead" ? "border-amber-500/40 text-amber-300" : "border-nmcn-border text-nmcn-muted"
                          }`}
                        >
                          {p.role.replace("_", " ")}
                        </span>
                        <button
                          className="btn-outline whitespace-nowrap px-2 py-0.5 text-[11px] disabled:opacity-50"
                          disabled={busy}
                          title={`Make ${p.name} a manager`}
                          onClick={() => setRole(p.id, "manager")}
                        >
                          Manager
                        </button>
                        <button
                          className="btn-outline whitespace-nowrap px-2 py-0.5 text-[11px] disabled:opacity-50"
                          disabled={busy}
                          title={`Make ${p.name} a scout`}
                          onClick={() => setRole(p.id, "scout")}
                        >
                          Scout
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-nmcn-muted">
                    Promoting a team lead moves them out of the &quot;Team lead&quot; list above — promote them back any time.
                  </p>
                </div>
              )}

              {/* 3 — Creators: multi-select across ALL profiles on file. */}
              <div className="text-xs text-nmcn-muted">
                <div className="mb-1 flex items-center justify-between">
                  <span>3 · Creators — all {asg.creators.length} profiles on file</span>
                  <span className="text-nmcn-gold">{picked.length} selected</span>
                </div>
                <input
                  className="input mb-1 text-sm"
                  placeholder="Search by username or team lead…"
                  value={creatorQuery}
                  onChange={e => setCreatorQuery(e.target.value)}
                />
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-nmcn-border p-2">
                  {shownCreators.map(c => (
                    <label key={c.backstageCreatorId} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={picked.includes(c.backstageCreatorId)}
                        onChange={() => toggleCreator(c.backstageCreatorId)}
                        className="accent-nmcn-gold"
                      />
                      <span className="text-sm text-white">@{c.username}</span>
                      <span className="truncate text-[11px] text-nmcn-muted">{c.teamLead || "no team lead in data"}</span>
                    </label>
                  ))}
                  {shownCreators.length === 0 && (
                    <p className="p-1 text-[11px] text-nmcn-muted">No profile matches &quot;{creatorQuery}&quot;.</p>
                  )}
                </div>
                <div className="mt-1 flex gap-3">
                  <button className="text-nmcn-blue hover:underline" onClick={() => setPicked(shownCreators.map(c => c.backstageCreatorId))}>
                    Select all shown ({shownCreators.length})
                  </button>
                  <button className="text-nmcn-muted hover:underline" onClick={() => setPicked([])}>
                    Clear ({picked.length})
                  </button>
                </div>
              </div>

              <button
                className="btn-gold w-full whitespace-nowrap text-sm disabled:opacity-50"
                disabled={busy || !assign.teamLeadId || (!assign.managerId && !assign.scoutId)}
                onClick={save}
              >
                {picked.length
                  ? `Assign ${picked.length} creator${picked.length === 1 ? "" : "s"} + team`
                  : "Assign manager/scout to team"}
              </button>

              <p className="text-[11px] leading-relaxed text-nmcn-muted">
                Manager and/or scout go onto the selected team. Ticked creators are attached to them too —
                how you add someone who joins or take off someone who leaves. Every row below stays editable.
              </p>
              {asg.managers.length === 0 && <p className="text-xs text-nmcn-muted">No manager staff accounts yet. Create one below.</p>}
            </div>
          </div>
          {/* Team roster — grouped by team lead. Every row is editable inline:
              change a role, move a creator to another profile, or remove
              someone from the team completely. */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
              Team roster · edit anyone here
            </p>
            <div className="space-y-3">
              {asg.teamLeads.map(t => {
                // Anchor rows (lead set) = managers/scouts on the team — includes
                // legacy rows that also carry a creator. Pure creator rows have
                // no anchor of their own; their team comes from the data sheet.
                const onTeam = asg.assignments.filter(a => a.leadId === t.id && a.teamLead !== null);
                const creatorRows = asg.assignments.filter(a => a.leadId === t.id && a.teamLead === null && a.backstageCreatorId !== null);
                return (
                  <div key={t.id} className="rounded-lg border border-nmcn-border p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-white">
                        {t.name} <span className="text-xs font-normal text-nmcn-muted">{t.email}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-sm text-nmcn-gold">{t.creators} creators on file</span>
                        {/* Owner-only: change this lead's role — how you take a
                            stray account off the team leads list without deleting it. */}
                        {canEditAll && t.role !== "admin" && (
                          <button
                            className="text-nmcn-muted hover:text-nmcn-gold"
                            title="Change role"
                            onClick={() => setEditLeadId(editLeadId === t.id ? null : t.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                    {editLeadId === t.id && canEditAll && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-nmcn-muted">Role for {t.name}:</span>
                        <select
                          className="input py-0 text-xs"
                          value={t.role}
                          onChange={e => { setEditLeadId(null); setRole(t.id, e.target.value); }}
                        >
                          <option value="team_lead">Team lead</option>
                          <option value="manager">Manager</option>
                          <option value="scout">Scout</option>
                          <option value="battle_coordinator">Battle coordinator</option>
                        </select>
                        <span className="text-nmcn-muted">They drop off the leads list for any role except Team lead.</span>
                      </div>
                    )}
                    {t.mappedBackstageEmails.length > 0 && (
                      <p className="text-[11px] text-nmcn-blue">Backstage: {t.mappedBackstageEmails.join(", ")}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-nmcn-muted">On team:</span>

                      {/* Managers & scouts on this team */}
                      {onTeam.map(a => (
                        <span key={a.id} className="flex flex-wrap items-center gap-1 rounded-full border border-nmcn-border px-2 py-1 text-xs">
                          <span className={a.manager.role === "scout" ? "text-nmcn-blue" : "text-white"}>
                            {a.manager.role === "scout" ? "Scout" : a.manager.role === "team_lead" ? "Lead" : a.manager.role === "battle_coordinator" ? "Coordinator" : "Manager"} {a.manager.name}
                          </span>
                          {a.backstageCreatorId && (
                            <span className="text-nmcn-muted">→ @{a.creatorUsername || a.backstageCreatorId}</span>
                          )}
                          {canEditAll && (
                            <button className="text-nmcn-muted hover:text-nmcn-gold" title="Change role" onClick={() => setEditId(editId === a.id ? null : a.id)}>
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                          <button className="text-nmcn-muted hover:text-red-400" title="Remove from team" onClick={() => remove(a.id)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                          {editId === a.id && canEditAll && (
                            <select
                              className="input ml-1 py-0 text-xs"
                              value={a.manager.role}
                              onChange={e => setRole(a.manager.id, e.target.value)}
                            >
                              <option value="manager">Manager</option>
                              <option value="scout">Scout</option>
                              <option value="team_lead">Team lead</option>
                              <option value="battle_coordinator">Battle coordinator</option>
                            </select>
                          )}
                        </span>
                      ))}

                      {/* Every creator profile on this team — the full roster,
                          whether or not an assignment row exists. Managers and
                          scouts can finally see who belongs where. */}
                      {asg.creators.filter(c => c.leadId === t.id).map(c => {
                        const row = creatorRows.find(a => a.backstageCreatorId === c.backstageCreatorId);
                        return (
                          <span key={c.backstageCreatorId} className="flex flex-wrap items-center gap-1 rounded-full border border-nmcn-border px-2 py-1 text-xs">
                            <span className="text-white">@{c.username}</span>
                            {row && (
                              <button className="text-nmcn-muted hover:text-nmcn-gold" title="Move to another profile" onClick={() => setEditId(editId === row.id ? null : row.id)}>
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                            {row && (
                              <button className="text-nmcn-muted hover:text-red-400" title="Remove from team" onClick={() => remove(row.id)}>
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                            {canEditAll && (
                              <button className="text-nmcn-muted hover:text-red-400" title="Remove from stats entirely (left the agency)" onClick={() => hideCreator(c.backstageCreatorId, c.username)}>
                                <UserX className="h-3 w-3" />
                              </button>
                            )}
                            {row && editId === row.id && (
                              <select
                                className="input ml-1 py-0 text-xs"
                                value={row.backstageCreatorId || ""}
                                onChange={e => reassign(row.id, e.target.value)}
                              >
                                <option value="">Move to another profile…</option>
                                {asg.creators.map(o => (
                                  <option key={o.backstageCreatorId} value={o.backstageCreatorId}>@{o.username}</option>
                                ))}
                              </select>
                            )}
                          </span>
                        );
                      })}

                      {onTeam.length === 0 && asg.creators.filter(c => c.leadId === t.id).length === 0 && (
                        <span className="text-xs text-nmcn-muted">
                          No managers, scouts or creators on this team yet — use the assign box above.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {asg.teamLeads.length === 0 && (
                <p className="text-sm text-nmcn-muted">No team lead accounts yet — create one below.</p>
              )}
            </div>

            {/* Rows not attached to any known team yet */}
            {(() => {
              const orphans = asg.assignments.filter(a => a.leadId === null);
              if (!orphans.length) return null;
              return (
                <div className="mt-3 rounded-lg border border-amber-400/30 p-3">
                  <p className="mb-2 text-xs font-semibold text-amber-300">Not on any team yet</p>
                  <div className="flex flex-wrap gap-2">
                    {orphans.map(a => (
                      <span key={a.id} className="flex items-center gap-1 rounded-full border border-nmcn-border px-2 py-1 text-xs">
                        <span className="text-white">
                          {a.manager.role === "scout" ? "Scout" : "Manager"} {a.manager.name}
                          {a.backstageCreatorId ? ` → @${a.creatorUsername || a.backstageCreatorId}` : ""}
                        </span>
                        <button className="text-nmcn-muted hover:text-red-400" title="Remove" onClick={() => remove(a.id)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Creator profiles that don't resolve to any team — assign them so
                their lead/manager can see them. */}
            {(() => {
              const unteamed = asg.creators.filter(c => c.leadId === null);
              if (!unteamed.length) return null;
              return (
                <div className="mt-3 rounded-lg border border-amber-400/30 p-3">
                  <p className="mb-2 text-xs font-semibold text-amber-300">
                    Profiles not on a team yet · {unteamed.length}
                  </p>
                  <p className="mb-2 text-[11px] text-nmcn-muted">
                    Their Backstage &quot;Creator Network manager&quot; email matches no staff account. Map the email above or attach them with the assign box.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unteamed.map(c => (
                      <span key={c.backstageCreatorId} className="flex items-center gap-1 rounded-full border border-nmcn-border px-2 py-1 text-xs">
                        <span className="text-white">@{c.username}</span>
                        {c.teamLead && <span className="text-nmcn-muted">{c.teamLead}</span>}
                        {canEditAll && (
                          <button className="text-nmcn-muted hover:text-red-400" title="Remove from stats entirely (left the agency)" onClick={() => hideCreator(c.backstageCreatorId, c.username)}>
                            <UserX className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Removed from stats (left the agency) — owner can restore. */}
            {canEditAll && asg.hidden.length > 0 && (
              <div className="mt-3 rounded-lg border border-nmcn-border p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Removed from stats · {asg.hidden.length}
                </p>
                <p className="mb-2 text-[11px] text-nmcn-muted">
                  These profiles are hidden on every stats page and skipped on future uploads. Restoring brings their saved stats back.
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                  {asg.hidden.map(h => (
                    <li key={h.backstageCreatorId} className="flex items-center justify-between gap-2">
                      <span className="text-white">@{h.username} <span className="text-nmcn-muted">· removed {fmtDate(h.hiddenAt)}</span></span>
                      <button className="flex items-center gap-1 text-nmcn-blue hover:underline" onClick={() => unhideCreator(h.backstageCreatorId)}>
                        <RotateCcw className="h-3 w-3" /> Restore
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Profile ↔ account (owner only): bind a Backstage profile (of the
              162) to a site account — for when a creator signs up or you create them. */}
          {canEditAll && (
          <div className="mt-6 space-y-2 rounded-lg border border-nmcn-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
              Link a creator profile to an account
            </p>
            <p className="text-xs text-nmcn-muted">
              When a creator makes an account (or you make one for them), pick their profile from the data
              sheet so their stats follow the account automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                className="input min-w-[220px] flex-1 text-sm"
                value={linkForm.accountId}
                onChange={e => setLinkForm(f => ({ ...f, accountId: e.target.value }))}
              >
                <option value="">Account…</option>
                {asg.creatorAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.email}{a.tiktokHandle ? ` · @${a.tiktokHandle.replace(/^@+/, "")}` : ""}{a.linked ? ` — linked to @${a.linked.username}` : ""}
                  </option>
                ))}
              </select>
              <select
                className="input min-w-[220px] flex-1 text-sm"
                value={linkForm.creatorId}
                onChange={e => setLinkForm(f => ({ ...f, creatorId: e.target.value }))}
              >
                <option value="">Profile ({asg.creators.length})…</option>
                {asg.creators.map(c => (
                  <option key={c.backstageCreatorId} value={c.backstageCreatorId}>
                    @{c.username}{c.accountId ? " — linked" : ""}
                  </option>
                ))}
              </select>
              <button
                className="btn-gold whitespace-nowrap text-sm disabled:opacity-50"
                disabled={busy || !linkForm.accountId || !linkForm.creatorId}
                onClick={linkProfile}
              >
                Link
              </button>
            </div>
            {linkMsg && <p className="text-sm text-nmcn-gold">{linkMsg}</p>}
            {(() => {
              const linked = asg.creatorAccounts.filter(a => a.linked);
              if (!linked.length) return null;
              return (
                <ul className="divide-y divide-nmcn-border/40 text-xs">
                  {linked.map(a => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="text-nmcn-text">
                        <span className="text-white">{a.name}</span> → @{a.linked!.username}
                      </span>
                      <button
                        className="text-nmcn-muted hover:text-red-400"
                        onClick={() => unlinkProfile(a.linked!.backstageCreatorId)}
                        aria-label={`Unlink ${a.name}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
          )}

          {/* Shortcut: add a team lead or manager without leaving this page.
              Uses the same /api/admin/staff/accounts "createStaff" flow as Staff → Accounts. */}
          <form onSubmit={createStaff} className="mt-6 rounded-lg border border-nmcn-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
              Add a team lead or manager
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-nmcn-muted">
                Name
                <input
                  className="input mt-1 block text-sm"
                  value={staffForm.name}
                  onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </label>
              <label className="text-xs text-nmcn-muted">
                Email
                <input
                  type="email"
                  className="input mt-1 block text-sm"
                  value={staffForm.email}
                  onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="their@email.com"
                  required
                />
              </label>
              <label className="text-xs text-nmcn-muted">
                Password
                <input
                  type="text"
                  className="input mt-1 block text-sm"
                  value={staffForm.password}
                  onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="They can change it later"
                  required
                />
              </label>
              <label className="text-xs text-nmcn-muted">
                Role
                <select
                  className="input mt-1 block text-sm"
                  value={staffForm.role}
                  onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="team_lead">Team Lead</option>
                  <option value="manager">Manager</option>
                  <option value="scout">Scout</option>
                  <option value="battle_coordinator">Battle Coordinator</option>
                </select>
              </label>
              <button type="submit" className="btn-gold text-sm disabled:opacity-50" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
            </div>
            {staffMsg && <p className="mt-3 text-sm text-nmcn-gold">{staffMsg}</p>}
            <p className="mt-2 text-xs text-nmcn-muted">
              Same accounts as Staff → Accounts. If their Backstage email differs from this one, link it above.
            </p>
          </form>
        </>
      )}
    </section>
  );
}
