"use client";

export default function OpenLoginButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-login"))}
      className={className}
    >
      {children}
    </button>
  );
}
