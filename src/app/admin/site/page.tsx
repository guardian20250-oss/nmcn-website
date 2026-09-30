"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ExternalLink, Home, CheckCircle2, XCircle } from "lucide-react";

interface SiteSettingField {
  key: string;
  label: string;
  hint: string;
  maxLength: number;
  multiline?: boolean;
}

export default function SiteSettingsPage() {
  const [fields, setFields] = useState<SiteSettingField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/site-settings");
        if (res.ok) {
          const data = await res.json();
          setFields(data.fields || []);
          setValues(data.settings || {});
        } else if (res.status === 401) {
          router.push("/admin/login");
        } else {
          setForbidden(true);
        }
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        setValues(data.settings || values);
        setMessage({ type: "ok", text: "Saved. The home page updates immediately." });
      } else {
        setMessage({ type: "error", text: data.error || "Could not save" });
      }
    } catch {
      setMessage({ type: "error", text: "Could not save — try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen px-6 pt-24">
        <div className="card mx-auto max-w-3xl p-8 text-center">
          <h1 className="mb-2 font-heading text-2xl font-bold text-white">Admins Only</h1>
          <p className="mb-6 text-nmcn-muted">
            Only admin accounts can edit the home page content.
          </p>
          <a href="/admin" className="btn-outline inline-block">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const stats = fields.filter((f) => f.key.startsWith("stat_"));

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Home Page Content</h1>
            <p className="text-nmcn-muted">
              Edit the numbers and intro text shown on nexusmafiaagency.com
            </p>
          </div>
          <a href="/admin" className="text-sm text-nmcn-muted transition hover:text-nmcn-blue">
            ← Back to Dashboard
          </a>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((f) => (
            <div key={f.key} className="stat-card">
              <div className="stat-num">{values[f.key] || "—"}</div>
              <div className="stat-label">{f.label}</div>
            </div>
          ))}
        </div>

        <form onSubmit={save} className="card space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.multiline ? "sm:col-span-2" : ""}>
                <label
                  htmlFor={field.key}
                  className="mb-1.5 block text-sm font-semibold text-white"
                >
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    id={field.key}
                    className="input min-h-28 resize-y"
                    maxLength={field.maxLength}
                    value={values[field.key] || ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    id={field.key}
                    className="input"
                    maxLength={field.maxLength}
                    value={values[field.key] || ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                  />
                )}
                <p className="mt-1 text-xs text-nmcn-muted">{field.hint}</p>
              </div>
            ))}
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                message.type === "ok"
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}
            >
              {message.type === "ok" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </button>
            <a href="/" target="_blank" className="btn-outline inline-flex items-center gap-2 text-sm">
              <ExternalLink className="h-4 w-4" /> Preview Home Page
            </a>
            <a href="/admin" className="btn-outline inline-flex items-center gap-2 text-sm">
              <Home className="h-4 w-4" /> Dashboard
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
