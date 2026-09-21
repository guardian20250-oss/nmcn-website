"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/battle-exchange", label: "Battle Exchange" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
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
          <Link
            href="https://www.tiktok.com/t/ZTkotVJB5/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold text-sm"
          >
            Join NMCN
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
              href="/join"
              onClick={() => setMobileOpen(false)}
              className="btn-gold mt-2 text-center text-sm"
            >
              Join NMCN
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
