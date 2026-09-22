export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="border-b border-nmcn-gold/30 bg-nmcn-gold/10 px-6 py-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[2px] text-nmcn-gold">
          Preview Build — Creator Academy is coming soon. Explore freely.
        </p>
      </div>

      {children}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center overflow-hidden"
      >
        <span className="rotate-[-18deg] select-none border-4 border-nmcn-gold/25 px-8 py-4 font-heading text-5xl font-bold uppercase tracking-[0.2em] text-nmcn-gold/15 md:text-8xl">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
