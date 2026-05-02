import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Shield, KeyRound, Activity, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) navigate({ to: "/admin" });
  }, [loading, session, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">HyperAPI Admin</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
            <Button asChild><Link to="/signup">Sign up</Link></Button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl">
          API proxy with{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            API keys
          </span>{" "}
          & IP whitelisting
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Issue per-client API keys, lock requests to specific IPs, monitor every call,
          and forward to your upstream — all from one panel.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/signup">Get started</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/login">Sign in</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 md:grid-cols-3">
        {[
          { icon: KeyRound, t: "API Keys", d: "Auto-generated keys, regenerate anytime, suspend abusers." },
          { icon: ShieldCheck, t: "IP Whitelist", d: "Restrict each key to specific source IPs." },
          { icon: Activity, t: "Live Logs", d: "Every proxy call is recorded with timing & errors." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
