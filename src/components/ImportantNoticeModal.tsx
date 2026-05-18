import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ImportantNoticeModalProps {
  open: boolean;
  onAccept: () => void;
}

const EFFECTIVE_DATE = "2025-10-01";

export function ImportantNoticeModal({ open, onAccept }: ImportantNoticeModalProps) {
  const [ip, setIp] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || ip) return;
    let cancelled = false;
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setIp(d?.ip ?? null);
      })
      .catch(() => {
        if (!cancelled) setIp(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ip]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" aria-hidden />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="important-notice-title"
        className="relative z-10 w-full max-w-xl rounded-2xl border border-[color:var(--gold)]/50 overflow-hidden"
        style={{
          background: "var(--gradient-policy)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--gold) 25%, transparent), 0 30px 80px -20px color-mix(in oklab, black 80%, transparent), 0 0 80px -20px color-mix(in oklab, var(--gold) 35%, transparent)",
        }}
      >
        {/* Corner decorations */}
        <span className="pointer-events-none absolute top-2 left-2 h-5 w-5 border-t-2 border-l-2 border-[color:var(--gold)] rounded-tl-lg" />
        <span className="pointer-events-none absolute top-2 right-2 h-5 w-5 border-t-2 border-r-2 border-[color:var(--gold)] rounded-tr-lg" />
        <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-[color:var(--gold)] rounded-bl-lg" />
        <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-[color:var(--gold)] rounded-br-lg" />

        <div className="px-6 sm:px-10 pt-8 pb-6">
          {/* Warning icon */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-destructive/60"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--destructive) 25%, transparent), transparent 70%)",
              }}
            >
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h2
              id="important-notice-title"
              className="mt-4 text-3xl sm:text-4xl font-bold text-[color:var(--gold)] tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Important Notice
            </h2>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/85 text-center">
            <p>
              This website/service is{" "}
              <span className="text-destructive font-semibold">
                not available for users from India, Nepal, Sri Lanka
              </span>
              . Access from these regions is{" "}
              <span className="text-destructive font-semibold">strictly prohibited</span>.
            </p>
            <p className="text-[color:var(--gold)]/90">
              All queries or issues should be directed to the authorized operator.
            </p>
            <p className="font-semibold text-foreground">
              Contact Person: Raj, Dhaka, Bangladesh
            </p>
            <p>
              By accessing this website, you confirm that you are{" "}
              <span className="text-destructive font-semibold">
                not located in India, Nepal, Sri Lanka
              </span>
              .
            </p>
            <p className="text-xs text-foreground/60">
              Unauthorized access from these regions is not permitted.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[color:var(--gold)]/20 text-center text-xs text-foreground/65 space-y-1">
            <div>
              Effective from: <span className="text-foreground/85">{EFFECTIVE_DATE}</span>
            </div>
            <div>
              Your IP:{" "}
              <span className="text-[color:var(--gold)] font-mono">
                {ip ?? "detecting…"}
              </span>
            </div>
          </div>

          <button
            onClick={onAccept}
            className="mt-6 w-full rounded-xl py-3.5 text-sm font-bold tracking-wide text-[color:var(--gold-foreground)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.78 0.16 60), oklch(0.86 0.17 85), oklch(0.78 0.16 60))",
              boxShadow:
                "0 10px 30px -10px color-mix(in oklab, var(--gold) 60%, transparent)",
            }}
          >
            I UNDERSTAND &amp; ACCEPT
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportantNoticeModal;