import Link from "next/link";

export default function AcademyNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-16 text-center">
      <h1 className="font-heading text-4xl font-bold text-white">Not Found</h1>
      <p className="mt-2 text-nmcn-muted">
        That academy page doesn&apos;t exist yet.
      </p>
      <Link href="/academy" className="btn-gold mt-6">
        Back to Academy
      </Link>
    </div>
  );
}
