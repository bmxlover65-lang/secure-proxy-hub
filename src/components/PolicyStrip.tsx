import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { PolicyModal } from "./PolicyModal";
import { ImportantNoticeModal } from "./ImportantNoticeModal";

export function PolicyStrip() {
  const [open, setOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const location = useLocation();

  // Auto-open Important Notice on landing page (only once per session)
  useEffect(() => {
    if (location.pathname !== "/") return;
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("policy_notice_accepted") === "1") return;
      const t = setTimeout(() => setNoticeOpen(true), 400);
      return () => clearTimeout(t);
    } catch {
      /* ignore */
    }
  }, [location.pathname]);

  const handleAccept = () => {
    try {
      sessionStorage.setItem("policy_notice_accepted", "1");
    } catch {
      /* ignore */
    }
    setNoticeOpen(false);
  };

  return (
    <>
      <div
        className="w-full border-t border-[color:var(--gold)]/40 backdrop-blur-md"
        style={{ background: "var(--gradient-policy)" }}
      >
        <div className="mx-auto max-w-7xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3">
          <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[color:var(--gold)]" />
          <p className="flex-1 text-[11px] sm:text-xs leading-snug text-foreground/85">
            <span className="font-semibold text-[color:var(--gold)]">Policy:</span>{" "}
            Service not available for users from India, Nepal, Sri Lanka. Access from these regions is strictly prohibited.{" "}
            <span className="hidden sm:inline text-foreground/60">
              Contact: Raj, Dhaka, Bangladesh.
            </span>
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-md border border-[color:var(--gold)]/50 bg-[color:var(--gold)]/10 px-2 py-1 text-[10px] sm:text-xs font-medium text-[color:var(--gold)] hover:bg-[color:var(--gold)]/20 transition-colors"
          >
            Read full policy
          </button>
        </div>
      </div>
      <PolicyModal open={open} onClose={() => setOpen(false)} />
      <ImportantNoticeModal open={noticeOpen} onAccept={handleAccept} />
    </>
  );
}

export default PolicyStrip;