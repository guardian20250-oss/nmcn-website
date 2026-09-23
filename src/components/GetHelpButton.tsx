"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import SupportTicketModal from "@/components/SupportTicketModal";

export default function GetHelpButton({
  className = "btn-outline",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className} inline-flex items-center gap-2`}
      >
        <LifeBuoy className="h-4 w-4" />
        Get Help
      </button>
      <SupportTicketModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
