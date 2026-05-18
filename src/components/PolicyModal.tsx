import { useEffect } from "react";
import { FileText, X, ShieldAlert, Globe, Scale, UserX, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    icon: Globe,
    title: "Geographic Restrictions",
    body:
      "This service is strictly not available to users located in India, Nepal, or Sri Lanka. Any attempt to access from these regions is a violation of our terms.",
  },
  {
    icon: ShieldAlert,
    title: "IP Verification",
    body:
      "All incoming requests are subject to IP-based geolocation verification. Requests originating from restricted regions are logged and blocked automatically.",
  },
  {
    icon: Scale,
    title: "Legal Compliance",
    body:
      "Users are solely responsible for ensuring that their use of this service complies with all applicable local, national, and international laws and regulations.",
  },
  {
    icon: UserX,
    title: "Account Termination",
    body:
      "Accounts found in violation of geographic restrictions, abusing the API, or attempting to bypass security measures will be terminated without notice or refund.",
  },
  {
    icon: Mail,
    title: "Authorized Operator Contact",
    body:
      "This service is operated by Raj, based in Dhaka, Bangladesh. All official inquiries, support requests, and legal notices must be directed to this authorized contact only.",
  },
  {
    icon: CheckCircle2,
    title: "Acceptance of Terms",
    body:
      "By accessing or using this service, you acknowledge that you have read, understood, and agree to be bound by this policy in full.",
  },
];

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
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-modal-title"
        className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[hsl(var(--gold)/0.4)] bg-card shadow-2xl"
        style={{
          background: "var(--gradient-policy)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--gold) 30%, transparent), 0 30px 80px -20px color-mix(in oklab, black 70%, transparent)",
        }}
      >
        {/* Corner decorations */}
        <span className="pointer-events-none absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-[color:var(--gold)] rounded-tl-2xl" />
        <span className="pointer-events-none absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-[color:var(--gold)] rounded-tr-2xl" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-[color:var(--gold)] rounded-bl-2xl" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-[color:var(--gold)] rounded-br-2xl" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[color:var(--gold)]/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--gold)]/15 border border-[color:var(--gold)]/40">
              <FileText className="h-5 w-5 text-[color:var(--gold)]" />
            </div>
            <div>
              <h2
                id="policy-modal-title"
                className="text-lg sm:text-xl font-semibold text-[color:var(--gold)]"
              >
                Service Policy & Restrictions
              </h2>
              <p className="text-xs text-foreground/60">
                Please read carefully before continuing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close policy"
            className="rounded-md p-1.5 text-foreground/60 hover:bg-[color:var(--gold)]/10 hover:text-[color:var(--gold)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {sections.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-[color:var(--gold)]/15 bg-background/30 p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="h-4 w-4 text-[color:var(--gold)]" />
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/75">
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[color:var(--gold)]/20 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[color:var(--gold)] text-[color:var(--gold-foreground)] hover:bg-[color:var(--gold)]/90"
          >
            Close Policy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PolicyModal;