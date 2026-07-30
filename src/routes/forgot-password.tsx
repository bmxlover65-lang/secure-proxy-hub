import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { authPanel, authLabel, authInput, authButton, authIcon, authAlert, authLink } from "@/components/auth-ui";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset your password — Hyper Softs SaaS" },
      { name: "description", content: "Request a secure password reset link for your Hyper Softs SaaS reseller account." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:title", content: "Reset your password — Hyper Softs SaaS" },
      { property: "og:description", content: "Request a password reset link for your Hyper Softs reseller account." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sass.hyperapi.in/forgot-password" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://sass.hyperapi.in/forgot-password" }],
  }),
});

const schema = z.object({ email: z.string().trim().email().max(255) });

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setErrorMsg(error.message);
        toast.error(error.message);
      } else {
        setSent(true);
        toast.success("Reset link sent — check your inbox");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll email you a secure reset link">
      <form onSubmit={onSubmit} className={authPanel}>
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-primary/50 bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold uppercase tracking-tight">Check your email</h3>
              <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">
                We sent a password reset link to <span className="font-medium text-foreground">{email}</span>. Click the link to set a new password.
              </p>
            </div>
            <Link to="/login" className={`inline-flex text-xs ${authLink}`}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email" className={authLabel}>Email</Label>
              <div className="group relative">
                <Mail className={authIcon} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={authInput}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                  autoComplete="email"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className={authAlert}>
                {errorMsg}
              </div>
            )}

            <Button type="submit" className={authButton} disabled={submitting || !email}>
              <span className="flex items-center justify-center">
                {submitting ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Sending…</>
                ) : (
                  <>Send reset link <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
                )}
              </span>
            </Button>

            <p className="text-center font-mono text-xs text-muted-foreground">
              Remembered it?{" "}
              <Link to="/login" className={authLink}>
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </form>
    </AuthLayout>
  );
}