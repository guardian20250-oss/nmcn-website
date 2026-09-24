"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LogIn, Loader2, User } from "lucide-react";
import ForcePasswordChangeModal from "@/components/ForcePasswordChangeModal";

const baseNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academy", label: "Academy" },
  { href: "/contact", label: "Contact" },
];

interface SessionUser {
  id: number;
  email: string;
  name?: string;
  mustChangePassword?: boolean;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creator, setCreator] = useState<SessionUser | null>(null);
  const [staff, setStaff] = useState<SessionUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [forceCreator, setForceCreator] = useState(false);
  const [forceStaff, setForceStaff] = useState(false);

  const loggedIn = Boolean(creator || staff);

  useEffect(() => {
    const init = async () => {
      try {
        const [c, s] = await Promise.all([
          fetch("/api/academy/auth")
            .then(r => (r.ok ? r.json() : { user: null }))
            .catch(() => ({ user: null })),
          fetch("/api/admin/auth")
            .then(r => (r.ok ? r.json() : { user: null }))
            .catch(() => ({ user: null })),
        ]);
        if (c.user) setCreator(c.user);
        if (s.user) setStaff(s.user);
        if (c.user?.mustChangePassword) setForceCreator(true);
        else if (s.user?.mustChangePassword) setForceStaff(true);
      } catch {
        // stay logged out
      }
      if (new URLSearchParams(window.location.search).get("login") === "1") {
        setLoginOpen(true);
      }
    };
    init();

    const onOpenLogin = () => setLoginOpen(true);
    window.addEventListener("open-login", onOpenLogin);
    return () => window.removeEventListener("open-login", onOpenLogin);
  }, []);

  const navLinks = loggedIn
    ? [...baseNavLinks.slice(0, 2), { href: "/battle-exchange", label: "Battle Exchange" }, ...baseNavLinks.slice(2)]
    : baseNavLinks;

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    try {
      const res = await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "login", email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }
      if (data.pending) {
        setLoginError("Your account is pending approval. Please wait for an admin to approve it.");
        return;
      }
      if (data.user?.mustChangePassword) {
        setLoginOpen(false);
        setCreator(data.user);
        setForceCreator(true);
        return;
      }
      window.location.reload();
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginBusy(false);
    }
  };

  const accountButton = loggedIn ? (
    creator ? (
      <Link href="/academy/account" className="btn-outline flex items-center gap-2 text-sm">
        <User className="h-4 w-4" />
        My Account
      </Link>
    ) : (
      <Link href="/admin" className="btn-outline flex items-center gap-2 text-sm">
        <User className="h-4 w-4" />
        Dashboard
      </Link>
    )
  ) : (
    <button onClick={() => setLoginOpen(true)} className="btn-gold flex items-center gap-2 text-sm">
      <LogIn className="h-4 w-4" />
      Log In
    </button>
  );

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-nmcn-border bg-nmcn-black/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-nmcn-blue bg-nmcn-blue/10 font-heading text-lg font-bold text-nmcn-blue">
            N
          </span>
          <span className="font-heading text-xl font-semibold text-white">
            NEXUS <span className="gold-text">MAFIA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-nmcn-muted transition hover:text-nmcn-blue"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/academy" className="btn-outline text-sm">
            Academy
          </Link>
          {!loggedIn && (
            <Link href="/academy/account?mode=register" className="btn-outline text-sm">
              Create Account
            </Link>
          )}
          {!loggedIn && (
            <Link href="/admin/login" className="btn-outline text-sm">
              Staff Login
            </Link>
          )}
          {accountButton}
          <Link
            href="/join"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold text-sm"
          >
            Apply Now
          </Link>
        </div>

        <button
          className="text-nmcn-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-nmcn-border bg-nmcn-black/95 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-nmcn-muted transition hover:text-nmcn-blue"
              >
                {link.label}
              </Link>
            ))}
            <Link
                href="/academy"
                onClick={() => setMobileOpen(false)}
                className="btn-outline mt-2 text-center text-sm"
            >
              Academy
            </Link>
            {!loggedIn && (
              <Link
                  href="/academy/account?mode=register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline mt-2 text-center text-sm"
              >
                Create Account
              </Link>
            )}
            {!loggedIn && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setLoginOpen(true);
                }}
                className="btn-gold mt-2 flex items-center justify-center gap-2 text-center text-sm"
              >
                <LogIn className="h-4 w-4" />
                Log In
              </button>
            )}
            {loggedIn && creator && (
              <Link
                  href="/academy/account"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline mt-2 text-center text-sm"
              >
                My Account
              </Link>
            )}
            {loggedIn && !creator && (
              <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline mt-2 text-center text-sm"
              >
                Dashboard
              </Link>
            )}
            {!loggedIn && (
              <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline mt-2 text-center text-sm"
              >
                Staff Login
              </Link>
            )}
            <Link
              href="/join"
              onClick={() => setMobileOpen(false)}
              className="btn-gold mt-2 text-center text-sm"
            >
              Apply Now
            </Link>
          </nav>
        </div>
      )}
    </header>

      {loginOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4"
          onClick={() => !loginBusy && setLoginOpen(false)}
        >
          <div className="card w-full max-w-sm p-6 sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-white">Log In</h2>
                <p className="mt-1 text-sm text-nmcn-muted">
                  Access the academy and Battle Exchange.
                </p>
              </div>
              <button
                onClick={() => setLoginOpen(false)}
                className="text-nmcn-muted hover:text-white transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="input"
                />
              </div>

              {loginError && <p className="text-sm text-red-400">{loginError}</p>}

              <button
                type="submit"
                disabled={loginBusy}
                className="btn-gold flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                {loginBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Log In
                  </>
                )}
              </button>

              <p className="text-center text-xs text-nmcn-muted">
                Staff member?{" "}
                <Link href="/admin/login" className="text-nmcn-blue hover:underline">
                  Use Staff Login
                </Link>
                {" · "}
                <Link href="/academy/account?mode=register" className="text-nmcn-blue hover:underline">
                  Create Account
                </Link>
              </p>
            </form>
          </div>
        </div>
      )}

      <ForcePasswordChangeModal
        variant="creator"
        open={forceCreator}
        email={creator?.email}
        onDone={() => {
          setForceCreator(false);
          setCreator(c => (c ? { ...c, mustChangePassword: false } : c));
        }}
      />
      <ForcePasswordChangeModal
        variant="admin"
        open={forceStaff}
        email={staff?.email}
        onDone={() => {
          setForceStaff(false);
          setStaff(s => (s ? { ...s, mustChangePassword: false } : s));
        }}
      />
    </>
  );
}
