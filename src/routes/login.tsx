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

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Hyper Softs SaaS" }] }),
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
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your admin dashboard">
      <form
        onSubmit={onSubmit}
        className="relative space-y-5 overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-7 backdrop-blur-2xl"
        style={{ boxShadow: "var(--shadow-elegant)" }}
      >
        {/* subtle gradient border glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 60%, transparent), transparent)" }}
        />

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground transition-colors hover:text-primary">
              Forgot?
            </Link>
          </div>
          <div className="group relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 border-border/60 bg-background/40 pl-11 pr-11 text-base backdrop-blur transition-all focus-visible:border-primary/60 focus-visible:bg-background/70"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
              autoComplete="current-password"
              disabled={submitting}
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

        {errorMsg && (
          <div
            role="alert"
            className="animate-fade-in rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          className="group relative h-12 w-full overflow-hidden text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          disabled={submitting || !email || !password}
        >
          {/* shimmer */}
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
          <span className="relative flex items-center justify-center">
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
            ) : (
              <>Sign in <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>
            )}
          </span>
        </Button>

        <div className="relative py-1 text-center text-xs text-muted-foreground">
          <div className="absolute inset-0 top-1/2 h-px bg-border/60" />
          <span className="relative bg-card/80 px-3 backdrop-blur-md">or</span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-primary transition-colors hover:text-primary/80">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
