export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="border-b border-nmcn-gold/30 bg-nmcn-gold/10 px-6 py-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[2px] text-nmcn-gold">
          Creator & Staff Academy
        </p>
      </div>

      {children}
    </div>
  );
}
