"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LogIn, Loader2, User, LogOut } from "lucide-react";
import ForcePasswordChangeModal from "@/components/ForcePasswordChangeModal";
import CreateAccountModal from "@/components/CreateAccountModal";

const baseNavLinks = [
  { href: "/", label: "Home" },
  { href: "https://nmcnbattleexchange.com/pickup-board", label: "Pickup Board", external: true },
  { href: "/academy", label: "Academy" },
  { href: "/contact", label: "Contact" },
];

// Where each staff role lands after login. The role comes back from the
// login endpoint now — every staff role's home is the staff dashboard.
const STAFF_HOME: Record<string, string> = {
  admin: "/admin",
  manager: "/admin",
  team_lead: "/admin",
  scout: "/admin",
  battle_coordinator: "/admin",
};

function NavLink({ link, onClick }: { link: { href: string; label: string; external?: boolean }; onClick?: () => void }) {
  if (link.external) {
    return (
      // External links (e.g. Pickup Board) keep opening in a new tab, but show
      // only the label — the icon pushed the header past its width on md screens.
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="text-sm font-medium text-nmcn-muted transition hover:text-nmcn-blue"
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className="text-sm font-medium text-nmcn-muted transition hover:text-nmcn-blue"
    >
      {link.label}
    </Link>
  );
}

interface SessionUser {
  id: number;
  email: string;
  name?: string;
  role?: string;
  mustChangePassword?: boolean;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creator, setCreator] = useState<SessionUser | null>(null);
  const [staff, setStaff] = useState<SessionUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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

  // Stats links: main site only. They are never added to the separate Battle Exchange site.
  const statsLinks = [
    ...(creator ? [{ href: "/academy/stats", label: "My Stats" }] : []),
    ...(staff && ["admin", "manager", "team_lead"].includes(staff.role || "")
      ? [{ href: "/admin/creator-stats", label: staff.role === "admin" ? "Creator Stats" : "Team Stats" }]
      : []),
  ];

  const navLinks = loggedIn
    ? [
        ...baseNavLinks.slice(0, 1),
        { href: "/battle-exchange", label: "Battle Exchange" },
        ...baseNavLinks.slice(1, 3),
        ...statsLinks,
        ...baseNavLinks.slice(3),
        // Dashboard sits next to Contact for staff only — login already
        // auto-directs staff there, this is just a shortcut.
        ...(staff ? [{ href: "/admin", label: "Dashboard" }] : []),
      ]
    : baseNavLinks;

  const isStaff = Boolean(staff);

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
      if (res.status === 401) {
        const sres = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const sdata = await sres.json().catch(() => ({}));
        if (!sres.ok) {
          setLoginError(sdata.error || "Invalid email or password");
          return;
        }
        if (sdata.pending) {
          setLoginError(sdata.message || "Your staff account request is pending approval.");
          return;
        }
        if (sdata.mustChangePassword) {
          setLoginOpen(false);
          setStaff({ id: 0, email, name: sdata.name, mustChangePassword: true });
          setForceStaff(true);
          return;
        }
        // Role detected from the login response — every staff role's home
        // is the staff dashboard.
        window.location.href = STAFF_HOME[String(sdata.role || "")] || "/admin";
        return;
      }
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
      // Role-based redirect: independent creators (external) go to the
      // academy, internal creators to their stats page.
      window.location.href =
        data.user?.independentCreator || data.user?.role === "independent_creator"
          ? "/academy"
          : "/academy/stats";
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginBusy(false);
    }
  };

  const logoutStaff = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // still reload below — worst case the cookie clears on next request
    }
    window.location.reload();
  };

  const accountButton = loggedIn ? (
    creator ? (
      <Link href="/academy/account" className="btn-outline flex items-center gap-2 text-sm">
        <User className="h-4 w-4" />
        My Account
      </Link>
    ) : (
      // Staff: login already auto-directs them to the dashboard, so this
      // button is Log Out now — Dashboard lives in the nav row instead.
      <button onClick={logoutStaff} className="btn-outline flex items-center gap-2 text-sm">
        <LogOut className="h-4 w-4" />
        Log Out
      </button>
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-nmcn-blue bg-nmcn-blue/10 font-heading text-lg font-bold text-nmcn-blue">
            N
          </span>
          <span className="font-heading text-xl font-semibold text-white">
            NEXUS <span className="gold-text">MAFIA</span>
          </span>
        </Link>

        {/* flex-wrap: on mid-width screens (or when logged in, which adds links)
            the links wrap onto a second line instead of clipping "Contact". */}
        <nav className="hidden flex-wrap items-center gap-x-6 gap-y-2 md:flex lg:gap-x-8">
          {navLinks.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {!loggedIn && (
            <button onClick={() => setCreateOpen(true)} className="btn-outline text-sm">
              Create Account
            </button>
          )}
          {accountButton}
          {!isStaff && (
            <Link
              href="/join"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold text-sm"
            >
              Apply Now
            </Link>
          )}
        </div>

        <button
          className="text-nmcn-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" className="border-t border-nmcn-border bg-nmcn-black/95 px-6 py-3 md:hidden">
          {/* gap-1 + the .mobile-nav padding rule in globals.css give every
              link a ~44px tap target; the standalone Academy link that used to
              sit here duplicated the one already in navLinks. */}
          <nav className="mobile-nav flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.href} link={link} onClick={() => setMobileOpen(false)} />
            ))}
            {!loggedIn && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setCreateOpen(true);
                }}
                className="btn-outline mt-2 text-center text-sm"
              >
                Create Account
              </button>
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
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logoutStaff();
                }}
                className="btn-outline mt-2 text-center text-sm"
              >
                Log Out
              </button>
            )}
            {!isStaff && (
              <Link
                  href="/join"
                onClick={() => setMobileOpen(false)}
                className="btn-gold mt-2 text-center text-sm"
              >
                Apply Now
              </Link>
            )}
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
                  Creators and staff both log in here.
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
                <button
                  type="button"
                  onClick={() => {
                    setLoginOpen(false);
                    setCreateOpen(true);
                  }}
                  className="text-nmcn-blue hover:underline"
                >
                  Create Account
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      <CreateAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onOpenLogin={() => setLoginOpen(true)}
      />

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
