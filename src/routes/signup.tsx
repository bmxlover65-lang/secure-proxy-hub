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
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — Reseller Panel" }] }),
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: isAdmin ? "/admin" : "/reseller" });
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
    <AuthLayout title="Create your account" subtitle="The first signup is automatically promoted to admin">
      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/60 p-6 shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-foreground/80">First account becomes administrator</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="full_name" placeholder="John Doe" className="pl-10"
              value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@example.com" className="pl-10"
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" placeholder="At least 8 characters" className="pl-10"
              value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </div>
        </div>
        <Button
          type="submit"
          className="group h-11 w-full text-sm font-semibold"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          disabled={submitting}
        >
          {submitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
          ) : (
            <>Create account <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
