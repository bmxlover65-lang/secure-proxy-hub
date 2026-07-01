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

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Forgot password — Hyper Softs SaaS" }] }),
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
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
      <form
        onSubmit={onSubmit}
        className="relative space-y-5 overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-7 backdrop-blur-2xl"
        style={{ boxShadow: "var(--shadow-elegant)" }}
      >
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Check your email</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a password reset link to <span className="font-medium text-foreground">{email}</span>. Click the link to set a new password.
              </p>
            </div>
            <Link to="/login" className="inline-flex text-sm font-semibold text-primary hover:text-primary/80">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 border-border/60 bg-background/40 pl-11 text-base backdrop-blur transition-all focus-visible:border-primary/60 focus-visible:bg-background/70"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                  autoComplete="email"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className="animate-fade-in rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              className="group relative h-12 w-full overflow-hidden text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              disabled={submitting || !email}
            >
              <span className="relative flex items-center justify-center">
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  <>Send reset link <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </span>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary/80">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </form>
    </AuthLayout>
  );
}