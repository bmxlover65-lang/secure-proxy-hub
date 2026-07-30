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
import { authPanel, authLabel, authInput, authInputPwd, authButton, authIcon, authAlert, authLink } from "@/components/auth-ui";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set a new password — Hyper Softs SaaS" },
      { name: "description", content: "Choose a new password for your Hyper Softs SaaS reseller account." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Set a new password — Hyper Softs SaaS" },
      { property: "og:description", content: "Choose a new password for your Hyper Softs reseller account." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sass.hyperapi.in/reset-password" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
    <AuthLayout title="New password" subtitle="Choose a strong password for your account">
      <form onSubmit={onSubmit} className={authPanel}>
        {ready && !hasSession ? (
          <div className="space-y-3 text-center">
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              This reset link is invalid or has expired. Request a new one.
            </p>
            <Link to="/forgot-password" className={`inline-flex text-xs ${authLink}`}>
              Send a new reset link
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="password" className={authLabel}>New password</Label>
              <div className="group relative">
                <Lock className={authIcon} />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className={authInputPwd}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                  autoComplete="new-password"
                  disabled={submitting || !hasSession}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground transition-colors hover:text-primary"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className={authLabel}>Confirm password</Label>
              <div className="group relative">
                <Lock className={authIcon} />
                <Input
                  id="confirm"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className={authInput}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErrorMsg(null); }}
                  autoComplete="new-password"
                  disabled={submitting || !hasSession}
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className={authAlert}>
                {errorMsg}
              </div>
            )}

            <Button type="submit" className={authButton} disabled={submitting || !hasSession || !password || !confirm}>
              <span className="flex items-center justify-center">
                {submitting ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Updating…</>
                ) : (
                  <>Update password <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
                )}
              </span>
            </Button>
          </>
        )}
      </form>
    </AuthLayout>
  );
}