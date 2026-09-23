"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthPrompt from "@/components/academy/AuthPrompt";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  tiktokHandle: string | null;
}

function AcademyAccountContent() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/academy/auth");
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen pt-16">
      <section className="px-6 py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <span className="mb-4 inline-block rounded-full border border-nmcn-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
              Academy
            </span>
            <h1 className="mb-2 font-heading text-3xl font-bold text-white">
              Save Your <span className="gold-text">Progress</span>
            </h1>
            <p className="mb-4 text-sm text-nmcn-muted">
              Optional — keeps your lesson scores and certificates synced across
              devices.
            </p>
            <Link href="/academy/account?mode=register" className="btn-gold text-sm">
              Create Free Account
            </Link>
          </div>

          {user === undefined ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
            </div>
          ) : user ? (
            <div className="card p-6 text-center">
              <p className="font-heading text-xl font-semibold text-white">
                {user.name}
              </p>
              <p className="text-sm text-nmcn-muted">{user.email}</p>
              {user.tiktokHandle && (
                <p className="text-sm text-nmcn-muted">{user.tiktokHandle}</p>
              )}
              <Link href="/academy" className="btn-gold mt-4 inline-flex">
                Back to Academy
              </Link>
              <div className="mt-4">
                <AuthPrompt />
              </div>
            </div>
          ) : (
            <AuthPrompt initialMode={mode} />
          )}
        </div>
      </section>
    </div>
  );
}

export default function AcademyAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
        </div>
      }
    >
      <AcademyAccountContent />
    </Suspense>
  );
}
