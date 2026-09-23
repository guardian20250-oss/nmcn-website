import { cookies } from "next/headers";
import { getCreatorAccountByToken } from "@/lib/auth";
import AcademyLogoutButton from "@/components/academy/AcademyLogoutButton";

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isLoggedIn = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("creator-token")?.value;
    const account = await getCreatorAccountByToken(token);
    isLoggedIn = Boolean(account && account.id);
  } catch {
    isLoggedIn = false;
  }

  return (
    <div className="relative">
      <div className="border-b border-nmcn-gold/30 bg-nmcn-gold/10 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-nmcn-gold">
            Creator &amp; Staff Academy
          </p>
          {isLoggedIn && <AcademyLogoutButton label="Log out" />}
        </div>
      </div>

      {children}
    </div>
  );
}
