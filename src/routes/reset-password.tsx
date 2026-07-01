import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Reset password — Hyper Softs SaaS" }] }),
});

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Supabase parses the recovery hash on load and fires PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(!!session);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        setErrorMsg(error.message);
        toast.error(error.message);
      } else {
        toast.success("Password updated — please sign in");
        await supabase.auth.signOut();
        navigate({ to: "/login" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account">
      <form
        onSubmit={onSubmit}
        className="relative space-y-5 overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-7 backdrop-blur-2xl"
        style={{ boxShadow: "var(--shadow-elegant)" }}
      >
        {ready && !hasSession ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired. Request a new one.
            </p>
            <Link to="/forgot-password" className="inline-flex text-sm font-semibold text-primary hover:text-primary/80">
              Send a new reset link
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New password</Label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 border-border/60 bg-background/40 pl-11 pr-11 text-base backdrop-blur"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                  autoComplete="new-password"
                  disabled={submitting || !hasSession}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm password</Label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 border-border/60 bg-background/40 pl-11 text-base backdrop-blur"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErrorMsg(null); }}
                  autoComplete="new-password"
                  disabled={submitting || !hasSession}
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
              disabled={submitting || !hasSession || !password || !confirm}
            >
              <span className="relative flex items-center justify-center">
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</>
                ) : (
                  <>Update password <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </span>
            </Button>
          </>
        )}
      </form>
    </AuthLayout>
  );
}