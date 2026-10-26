"use client";

// Upload a Backstage export + the upload history / audit log.
// Moved out of the dashboard into the backend management page.
import { useEffect, useState } from "react";
import { Loader2, Upload, Trash2, Link2, History as HistoryIcon } from "lucide-react";
import { fmt, fmtDate, typeLabel, type Preview, type Counts, type History } from "./shared";

export default function UploadPanel({ isOwner, onImported }: { isOwner: boolean; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [periodType, setPeriodType] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [unlink, setUnlink] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState<History | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/creator-stats").then(r => (r.ok ? r.json() : null)).then(d => alive && d && setHistory(d)).catch(() => {});
    return () => { alive = false; };
  }, [version]);

  const send = async (action: "preview" | "import") => {
    if (!file || !periodType) return;
    setBusy(true); setMsg("");
    const fd = new FormData();
    fd.append("file", file); fd.append("action", action); fd.append("periodType", periodType); fd.append("unlink", JSON.stringify([...unlink]));
    try {
      const res = await fetch("/api/admin/creator-stats", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Upload failed"); return; }
      if (action === "preview") { setPreview(data); setUnlink(new Set()); }
      else {
        const c: Counts = data.counts;
        setMsg(`Imported ${c.imported ?? c.toImport} creators · ${c.skippedOutOfScope} skipped (out of scope) · ${c.duplicateCount} already on file · ${c.unmatchedCount} not linked to an account.`);
        setPreview(null); setFile(null); onImported(); setVersion(v => v + 1);
      }
    } catch { setMsg("Network error"); } finally { setBusy(false); }
  };

  const removeSnapshot = async (id: number) => {
    if (!confirm("Delete this upload and the rows it added? Creators fall back to their previous stats.")) return;
    const res = await fetch(`/api/admin/creator-stats?id=${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Delete failed"); return; }
    onImported(); setVersion(v => v + 1);
  };

  const c = preview?.counts;
  return (
    <div className="mb-10 space-y-6">
      <section className="card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-semibold text-white"><Upload className="h-5 w-5 text-nmcn-gold" /> Upload Backstage export</h2>
        <p className="mb-4 text-sm text-nmcn-muted">
          LIVE Backstage → Manage creators → Export (.xlsx). {isOwner ? "Owner uploads import every creator in the file." : "Only creators in your team are imported; anything else in the file is skipped and never saved."}{" "}
          Creators not in the file keep their existing stats. The file itself is never stored.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select className="input w-auto text-sm" value={periodType} onChange={e => { setPeriodType(e.target.value); setPreview(null); }}>
            <option value="">Upload type…</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">End of Month</option>
          </select>
          <label className="btn-gold cursor-pointer text-sm">
            {file ? file.name : "Choose file (.xlsx)"}
            <input type="file" accept=".xlsx" className="sr-only" onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); setMsg(""); }} />
          </label>
          <button className="btn-outline text-sm disabled:opacity-50" disabled={!file || !periodType || busy} onClick={() => send("preview")}>
            {busy && !preview ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Preview"}
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-nmcn-gold">{msg}</p>}

        {preview && c && (
          <div className="mt-5">
            <div className="mb-3 grid gap-3 sm:grid-cols-4">
              {[["To import", c.toImport, "text-emerald-400"], ["Skipped · out of scope", c.skippedOutOfScope, "text-nmcn-muted"], ["Already on file", c.duplicateCount, "text-nmcn-muted"], ["Not linked to an account", c.unmatchedCount, "text-amber-300"]].map(([l, v, cls]) => (
                <div key={String(l)} className="rounded-lg border border-nmcn-border p-3">
                  <p className="text-xs text-nmcn-muted">{l}</p><p className={`text-xl font-bold ${cls}`}>{fmt(Number(v))}</p>
                </div>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-nmcn-text">{typeLabel(preview.periodType)} · exported {new Date(preview.exportedAt).toLocaleString()} · {preview.rows.filter(r => r.conflict).length} conflicts</p>
              <button className="btn-gold text-sm disabled:opacity-50" disabled={busy || c.toImport === 0} onClick={() => send("import")}>
                {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : `Confirm import (${c.toImport})`}
              </button>
            </div>
            {preview.warnings.map(w => <p key={w} className="text-xs text-amber-300">⚠ {w}</p>)}
            {preview.rows.length > 0 && (
              <div className="max-h-96 overflow-auto rounded-lg border border-nmcn-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-nmcn-panel text-nmcn-muted">
                    <tr><th className="p-2 text-left">Link</th><th className="p-2 text-left">Username</th><th className="p-2 text-left">Team lead</th><th className="p-2 text-left">Diamonds</th><th className="p-2 text-left">Days</th><th className="p-2 text-left">Account match</th></tr>
                  </thead>
                  <tbody>
                    {[...preview.rows].sort((a, b) => Number(!!b.conflict) - Number(!!a.conflict) || Number(!a.match) - Number(!b.match)).map(r => (
                      <tr key={r.backstageCreatorId} className={`border-t border-nmcn-border/40 ${r.conflict ? "bg-red-500/10" : !r.match ? "bg-amber-500/5" : ""}`}>
                        <td className="p-2">
                          {r.match && (
                            <input type="checkbox" checked={!unlink.has(r.backstageCreatorId)}
                              onChange={e => setUnlink(s => { const n = new Set(s); if (e.target.checked) n.delete(r.backstageCreatorId); else n.add(r.backstageCreatorId); return n; })} />
                          )}
                        </td>
                        <td className="p-2 text-white">@{r.username}</td>
                        <td className="p-2 text-nmcn-text">{r.teamLead || "—"}</td>
                        <td className="p-2 text-nmcn-text">{fmt(r.diamondsL30D)}</td>
                        <td className="p-2 text-nmcn-text">{r.validDaysL30D}</td>
                        <td className="p-2">
                          {r.match ? <span className="text-emerald-400"><Link2 className="inline h-3 w-3" /> {r.match.name}{r.match.email && ` · ${r.match.email}`}{r.linkedBy === "creatorId" && " (previous link)"}</span>
                            : <span className="text-amber-300">No account with this TikTok handle</span>}
                          {r.conflict && <p className="text-red-400">{r.conflict}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-white"><HistoryIcon className="h-5 w-5 text-nmcn-gold" /> {history?.canSeeAudit ? "Upload history & audit log" : "My uploads"}</h2>
        {history && (
          <div className={`grid gap-6 ${history.canSeeAudit ? "lg:grid-cols-2" : ""}`}>
            <div>
              {history.accountsWithoutHandle > 0 && <p className="mb-2 text-xs text-amber-300">{history.accountsWithoutHandle} active accounts have no TikTok handle saved, so they can&apos;t be matched.</p>}
              <ul className="divide-y divide-nmcn-border/40 text-sm">
                {history.snapshots.map(s => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className="text-white">{fmtDate(s.exportedAt)} · {typeLabel(s.periodType)} <span className="text-xs text-nmcn-muted">{s.originalFilename}</span></p>
                      <p className="text-xs text-nmcn-muted">
                        {s.rowCount} imported · {s.skippedOutOfScope} out of scope · {s.duplicateCount} already on file · {s.unmatchedCount} unlinked · by {s.uploadedBy?.name || "—"}{s.uploaderRole ? ` (${s.uploaderRole.replace("_", " ")})` : ""}
                      </p>
                    </div>
                    <button className="text-nmcn-muted hover:text-red-400" onClick={() => removeSnapshot(s.id)} aria-label="Delete upload"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
                {history.snapshots.length === 0 && <li className="py-2 text-nmcn-muted">No uploads yet.</li>}
              </ul>
            </div>
            {history.canSeeAudit && (
              <ul className="max-h-72 space-y-2 overflow-y-auto text-xs">
                {history.audit.map(a => (
                  <li key={a.id} className="rounded-lg border border-nmcn-border/40 p-2">
                    <p className="text-nmcn-text"><b className="uppercase text-nmcn-gold">{a.action}</b> · {a.adminEmail} · {new Date(a.createdAt).toLocaleString()}</p>
                    <p className="text-nmcn-muted">{a.details}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
