import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Shield, KeyRound, Activity, ShieldCheck, Coins, Wallet, Globe2, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [
    { title: "Hyper Softs SaaS — Premium API Proxy & Reseller Platform" },
    { name: "description", content: "Issue per-client API keys, top up your wallet, monitor every request — built for resellers." },
    { property: "og:title", content: "Hyper Softs SaaS — Premium API Proxy" },
    { property: "og:description", content: "API keys, wallet billing, IP whitelisting and live logs in one platform." },
    { property: "og:image", content: "/og-image.jpg" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "/og-image.jpg" },
  ] }),
});

function Index() {
  const { session, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) navigate({ to: isAdmin ? "/admin" : "/dashboard" });
  }, [loading, session, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundImage: "var(--gradient-mesh)" }}>
      <header className="border-b border-border/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Hyper Softs SaaS</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
            <Button asChild><Link to="/signup">Sign up</Link></Button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <Globe2 className="h-3.5 w-3.5" /> Reseller-ready API platform
        </div>
        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl">
          API proxy with{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>wallet billing</span>{" "}
          & full reseller control
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Sign up, top up your wallet, mint API keys on demand, and monitor every call — all from one premium dashboard.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/signup">Get started <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/login">Sign in</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-12 md:grid-cols-3">
        {[
          { icon: KeyRound, t: "API Keys on demand", d: "Mint keys instantly — coins are deducted from your wallet automatically." },
          { icon: Wallet, t: "Wallet & billing", d: "Top up coins, see every transaction, never overspend." },
          { icon: ShieldCheck, t: "IP Whitelist", d: "Restrict each key to specific source IPs." },
          { icon: Activity, t: "Live Logs", d: "Every proxy call recorded with timing & errors." },
          { icon: Coins, t: "Transparent pricing", d: "Pay per key in coins — admin controls the rate." },
          { icon: CheckCircle2, t: "Built for resellers", d: "Each reseller gets their own dashboard, keys & wallet." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
      <footer className="border-t border-border/60 mt-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} Hyper Softs SaaS. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
