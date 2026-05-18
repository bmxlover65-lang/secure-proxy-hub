import { useEffect } from "react";
import { FileText, X } from "lucide-react";

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const EFFECTIVE_DATE = "2025-10-01";
const LAST_UPDATED = "2025-10-01";

export function PolicyModal({ open, onClose }: PolicyModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-background/85 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restriction-policy-title"
        className="relative z-10 w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-[color:var(--gold)]/50 overflow-hidden"
        style={{
          background: "var(--gradient-policy)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--gold) 25%, transparent), 0 30px 80px -20px color-mix(in oklab, black 80%, transparent), 0 0 60px -20px color-mix(in oklab, var(--gold) 30%, transparent)",
        }}
      >
        {/* Corner decorations */}
        <span className="pointer-events-none absolute top-2 left-2 h-5 w-5 border-t-2 border-l-2 border-[color:var(--gold)] rounded-tl-lg" />
        <span className="pointer-events-none absolute top-2 right-2 h-5 w-5 border-t-2 border-r-2 border-[color:var(--gold)] rounded-tr-lg" />
        <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-[color:var(--gold)] rounded-bl-lg" />
        <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-[color:var(--gold)] rounded-br-lg" />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close policy"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--gold)]/40 bg-background/40 text-foreground/70 hover:text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 pt-8 pb-6">
          {/* Header icon + title */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[color:var(--gold)]/60 mb-4"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--gold) 20%, transparent), transparent 70%)",
              }}
            >
              <FileText className="h-7 w-7 text-[color:var(--gold)]" />
            </div>
            <h2
              id="restriction-policy-title"
              className="text-3xl sm:text-4xl font-bold text-[color:var(--gold)] tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Restriction Policy
            </h2>
            <span className="mt-2 h-0.5 w-24 bg-[color:var(--gold)]/60 rounded-full" />
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-foreground/85">
            <section>
              <h3 className="text-base font-semibold text-[color:var(--gold)] mb-2">
                1. Geographic Restrictions
              </h3>
              <p>
                This website and all associated services are{" "}
                <span className="text-destructive font-medium">strictly prohibited</span> for
                users located in or accessing from the following countries:
              </p>
              <ul className="mt-2 ml-5 list-disc space-y-1">
                <li>
                  <span className="font-semibold text-foreground">India</span>{" "}
                  <span className="text-foreground/70">(including all states and union territories)</span>
                </li>
                <li><span className="font-semibold text-foreground">Nepal</span></li>
                <li><span className="font-semibold text-foreground">Sri Lanka</span></li>
              </ul>
              <p className="mt-3">
                Any attempt to access this service from these regions using VPNs, proxies, or any
                other circumvention tools is a violation of this policy.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-[color:var(--gold)] mb-2">
                2. IP Verification
              </h3>
              <p>
                We actively monitor and verify user IP addresses. Access from IP ranges geolocated
                to India, Nepal, or Sri Lanka will be blocked automatically. Users may be required
                to undergo additional verification if their location cannot be definitively
                determined.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-[color:var(--gold)] mb-2">
                3. Legal Compliance
              </h3>
              <p>
                This restriction is in place to comply with applicable laws and regulations in the
                respective jurisdictions. Users are solely responsible for ensuring their use of
                this service complies with all local laws in their country of residence.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-[color:var(--gold)] mb-2">
                4. Account Termination
              </h3>
              <p>
                Any account found to be operated from India, Nepal, or Sri Lanka will be{" "}
                <span className="text-destructive font-medium">immediately terminated</span>{" "}
                without notice, and any associated balances will be forfeited.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-[color:var(--gold)] mb-2">
                5. Authorized Operator Contact
              </h3>
              <p>
                All queries, issues, or disputes must be directed to the authorized operator only.
                We do not provide direct support to end users.
              </p>
              <div className="mt-3 rounded-lg border border-[color:var(--gold)]/40 bg-background/40 p-4">
                <div className="text-foreground">
                  <span className="font-semibold">Contact Person:</span> Raj
                </div>
                <div className="text-[color:var(--gold)] mt-1">
                  Location: Dhaka, Bangladesh
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold text-[color:var(--gold)] mb-2">
                6. Acceptance of Terms
              </h3>
              <p>
                By accessing this website, you explicitly confirm and warrant that you are{" "}
                <span className="text-destructive font-medium">NOT located in India, Nepal, or Sri Lanka</span>{" "}
                and agree to comply with all terms outlined in this policy.
              </p>
            </section>

            <div className="pt-4 border-t border-[color:var(--gold)]/20 text-xs text-foreground/65 space-y-1">
              <div>
                <span className="font-semibold text-foreground/80">Effective Date:</span>{" "}
                {EFFECTIVE_DATE}
              </div>
              <div>
                <span className="font-semibold text-foreground/80">Last Updated:</span>{" "}
                {LAST_UPDATED}
              </div>
              <div className="text-foreground/55">
                This policy is subject to change without prior notice.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-10 pb-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide text-[color:var(--gold-foreground)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.78 0.16 60), oklch(0.86 0.17 85), oklch(0.78 0.16 60))",
              boxShadow:
                "0 10px 30px -10px color-mix(in oklab, var(--gold) 60%, transparent)",
            }}
          >
            CLOSE POLICY
          </button>
        </div>
      </div>
    </div>
  );
}

export default PolicyModal;