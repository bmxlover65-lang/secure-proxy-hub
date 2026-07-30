import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/AuthLayout";
import { toast } from "sonner";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authPanel, authLabel, authInput, authInputPwd, authButton, authIcon, authAlert, authLink } from "@/components/auth-ui";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — Hyper Softs SaaS Reseller Panel" },
      { name: "description", content: "Sign in to the Hyper Softs SaaS reseller panel to mint 30-day API keys, manage IP and domain whitelists, monitor live request logs and top up your coin wallet." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:title", content: "Sign in — Hyper Softs SaaS" },
      { property: "og:description", content: "Reseller sign-in for the Hyper Softs API proxy control plane." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sass.hyperapi.in/login" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://sass.hyperapi.in/login" }],
  }),
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

function LoginPage() {
  const { session, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        const msg = error.message === "Invalid login credentials"
          ? "Wrong email or password"
          : error.message;
        setErrorMsg(msg);
        toast.error(msg);
      } else {
        toast.success("Welcome back!");
        navigate({ to: "/admin" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Access your reseller control plane">
      <form onSubmit={onSubmit} className={authPanel}>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={authLabel}>Password</Label>
            <Link to="/forgot-password" className="label-mono text-[0.6rem] text-muted-foreground transition-colors hover:text-primary">
              Forgot?
            </Link>
          </div>
          <div className="group relative">
            <Lock className={authIcon} />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              className={authInputPwd}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
              autoComplete="current-password"
              disabled={submitting}
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

        {errorMsg && (
          <div role="alert" className={authAlert}>
            {errorMsg}
          </div>
        )}

        <Button type="submit" className={authButton} disabled={submitting || !email || !password}>
          <span className="flex items-center justify-center">
            {submitting ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Signing in…</>
            ) : (
              <>Sign in <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
            )}
          </span>
        </Button>

        <div className="h-px bg-border" />

        <p className="text-center font-mono text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className={authLink}>
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
