"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

export default function AcademyLogoutButton({
  className = "btn-outline text-sm",
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "logout" }),
      });
    } catch {
      // still navigate away
    }
    window.location.href = "/academy";
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={`${className} inline-flex items-center gap-2 disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
