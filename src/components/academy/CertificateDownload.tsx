"use client";

import { useState } from "react";
import { Download, Loader2, X, Award } from "lucide-react";
import { downloadCertificatePdf } from "@/lib/certificatePdf";
import type { LocalProgress } from "@/lib/academy";

interface Props {
  courseSlug: string;
  courseTitle: string;
  lessonIds: number[];
  progress: LocalProgress;
  onClose: () => void;
}

export default function CertificateDownload({
  courseSlug,
  courseTitle,
  lessonIds,
  progress,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [issuedDate, setIssuedDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const issueAndDownload = async (download: boolean) => {
    setStatus("loading");
    setError("");
    try {
      const payloadName = name.trim();
      if (!payloadName) {
        setStatus("error");
        setError("Enter the name that should appear on the certificate.");
        return;
      }

      const lessonProgress = lessonIds.map((id) => ({
        lessonId: id,
        passed: Boolean(progress[String(id)]?.passed),
      }));

      const res = await fetch("/api/academy/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          learnerName: payloadName,
          lessonProgress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Could not issue certificate.");
        return;
      }

      const issuedCode = data.certificate.code as string;
      const completed = data.certificate.completedAt as string;
      setCode(issuedCode);
      setIssuedDate(completed);
      setStatus("idle");

      if (download) {
        downloadCertificatePdf({
          learnerName: data.certificate.learnerName as string,
          courseTitle: data.certificate.courseTitle as string,
          code: issuedCode,
          date: completed,
        });
      }
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-nmcn-gold/40 bg-nmcn-gold/10">
              <Award className="h-5 w-5 text-nmcn-gold" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold text-white">
                Your Certificate
              </h3>
              <p className="text-xs text-nmcn-muted">{courseTitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-nmcn-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!code ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                Name on certificate *
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                maxLength={80}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              className="btn-gold w-full disabled:opacity-50"
              disabled={status === "loading"}
              onClick={() => issueAndDownload(true)}
            >
              {status === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Issue &amp; Download PDF
            </button>
            <button
              type="button"
              className="btn-outline w-full disabled:opacity-50"
              disabled={status === "loading"}
              onClick={() => issueAndDownload(false)}
            >
              Save without downloading
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-nmcn-gold/30 bg-nmcn-gold/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-nmcn-muted">
                Certificate code
              </p>
              <p className="font-heading text-2xl font-bold text-nmcn-gold">{code}</p>
              {issuedDate && (
                <p className="mt-1 text-xs text-nmcn-muted">
                  Issued {new Date(issuedDate).toLocaleDateString()}
                </p>
              )}
              <p className="mt-2 text-xs text-nmcn-muted">
                Keep this code — staff can verify it from the dashboard.
              </p>
            </div>
            <button
              type="button"
              className="btn-gold w-full"
              onClick={() =>
                downloadCertificatePdf({
                  learnerName: name.trim(),
                  courseTitle,
                  code,
                  date: issuedDate || new Date().toISOString(),
                })
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </button>
            <button type="button" className="btn-ghost w-full" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
