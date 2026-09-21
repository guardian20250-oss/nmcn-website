import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-nmcn-border bg-nmcn-black/95 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-nmcn-blue bg-nmcn-blue/10 font-heading text-lg font-bold text-nmcn-blue">
                N
              </span>
              <span className="font-heading text-xl font-semibold text-white">
                NEXUS <span className="gold-text">MAFIA</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-nmcn-muted">
              Nexus Mafia Creator Network LLC. Building empires through the
              right family.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-nmcn-blue">
              Quick Links
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
              >
                About Us
              </Link>
              <Link
                href="/battle-exchange"
                className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
              >
                Battle Exchange
              </Link>
              <Link
                href="/join"
                className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
              >
                Join NMCN
              </Link>
              <Link
                href="/contact"
                className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-nmcn-blue">
              Contact Info
            </h4>
            <div className="flex flex-col gap-2 text-sm text-nmcn-muted">
              <span>423-561-3080</span>
              <span>nmcn@nexusmafiaagency.com</span>
              <span>US &amp; Canada</span>
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.tiktok.com/@guardian20250"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-nmcn-border text-nmcn-muted transition hover:border-nmcn-blue hover:text-nmcn-blue"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
                </svg>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-nmcn-border text-nmcn-muted transition hover:border-nmcn-blue hover:text-nmcn-blue"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="section-divider mt-8 mb-6" />

        <div className="text-center text-xs text-nmcn-muted">
          <p>
            &copy; {new Date().getFullYear()} Nexus Mafia Creator Network LLC.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
