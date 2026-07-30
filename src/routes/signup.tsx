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
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight, Wallet, Eye, EyeOff } from "lucide-react";
import { authPanel, authLabel, authInput, authInputPwd, authButton, authIcon, authLink } from "@/components/auth-ui";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create a reseller account — Hyper Softs SaaS" },
      { name: "description", content: "Create a free Hyper Softs SaaS reseller account, top up your coin wallet and mint secure 30-day API keys with IP and domain whitelisting. 1000 coins = ₹2000." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Create a reseller account — Hyper Softs SaaS" },
      { property: "og:description", content: "Sign up as a reseller and mint secure 30-day API keys with IP whitelist, domain whitelist and rate limiting." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sass.hyperapi.in/signup" },
      { property: "og:image", content: "https://sass.hyperapi.in/og-hero.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://sass.hyperapi.in/og-hero.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://sass.hyperapi.in/signup" }],
  }),
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  full_name: z.string().trim().min(1).max(120),
});

function SignupPage() {
  const { session, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, full_name: fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: parsed.data.full_name },
        },
      });
      if (error) toast.error(error.message);
      else toast.success("Account created — signing you in…");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Register as a reseller and mint your first API key">
      <form onSubmit={onSubmit} className={authPanel}>
        <div className="flex items-center gap-3 border border-primary/40 bg-primary/[0.06] p-3">
          <Wallet className="h-4 w-4 shrink-0 text-primary" />
          <span className="label-mono text-[0.6rem] leading-relaxed text-muted-foreground">
            Coin wallet issued on signup · 1000 coins = ₹2000
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name" className={authLabel}>Full name</Label>
          <div className="group relative">
            <UserIcon className={authIcon} />
            <Input
              id="full_name"
              placeholder="John Doe"
              className={authInput}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

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
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className={authLabel}>Password</Label>
          <div className="group relative">
            <Lock className={authIcon} />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="At least 8 characters"
              className={authInputPwd}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

        <Button type="submit" className={authButton} disabled={submitting}>
          <span className="flex items-center justify-center">
            {submitting ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Creating account…</>
            ) : (
              <>Create account <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
            )}
          </span>
        </Button>

        <div className="h-px bg-border" />

        <p className="text-center font-mono text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className={authLink}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
