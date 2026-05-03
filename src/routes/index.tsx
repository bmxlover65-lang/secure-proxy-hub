import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Shield, KeyRound, Activity, ShieldCheck, Coins, Wallet, Globe2,
  ArrowRight, CheckCircle2, Send, Lock, Gauge, Network, Server, Clock, Sparkles, Zap,
} from "lucide-react";

const TELEGRAM = "Hyperdeveloperr";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Hyper Softs SaaS — Reseller API Proxy with IP Whitelist & Wallet Billing" },
      { name: "description", content: "Reseller-ready API proxy: per-key IP whitelist, domain whitelist, rate limiting, wallet billing in coins, 30-day validity, live request logs. 1000 coins = ₹2000." },
      { name: "keywords", content: "reseller api, api proxy, ip whitelist, rate limiting, wallet billing, secure api access, hyper softs, hyperapi" },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Hyper Softs SaaS — Secure Reseller API Proxy" },
      { property: "og:description", content: "Per-key IP & domain whitelist, rate limiting, wallet billing and 30-day API keys for resellers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sass.hyperapi.in/" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hyper Softs SaaS — Reseller API Proxy" },
      { name: "twitter:description", content: "Secure API proxy built for resellers — IP whitelist, rate limit, wallet billing." },
      { name: "twitter:image", content: "/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://sass.hyperapi.in/" },
    ],
  }),
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
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight">Hyper Softs</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">SaaS Platform</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#security" className="transition-colors hover:text-foreground">Security</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs hover:text-foreground hover:border-primary/40">
              <Send className="h-3 w-3" /> @{TELEGRAM}
            </a>
          </nav>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Login</Link></Button>
            <Button asChild size="sm"><Link to="/signup">Sign up</Link></Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-5xl px-4 py-20 text-center md:py-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Trusted by 200+ resellers worldwide
        </div>
        <h1 className="font-display text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Premium API proxy for{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
            SaaS
          </span>
          <br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
            Lottery Game
          </span>{" "}
          resellers
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl">
          Sign up, top up your wallet, mint API keys on demand, and monitor every call — all from one beautifully crafted dashboard.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="shadow-lg" style={{ boxShadow: "var(--shadow-glow)" }}>
            <Link to="/signup">Get started free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer">
              <Send className="mr-1.5 h-4 w-4" /> Talk on Telegram
            </a>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> 30-day API keys</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> 1000 coins = ₹2000</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Auto wallet credit on payment</span>
        </div>

        {/* Stats strip */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { v: "200+", l: "Resellers" },
            { v: "<200ms", l: "Avg latency" },
            { v: "99.99%", l: "Uptime" },
            { v: "24/7", l: "Monitoring" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border/60 px-4 py-4 text-center" style={{ background: "var(--gradient-card)" }}>
              <div className="font-display text-2xl font-bold tracking-tight">{s.v}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VALUE PROP — security & control */}
      <section id="security" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for resellers who need control</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Every API key you mint is protected by enterprise-grade controls — out of the box.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Network className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">IP Whitelist</h3>
            <p className="mt-2 text-sm text-muted-foreground">Lock each API key to one or many source IPs. Requests from unknown IPs are rejected with <code className="rounded bg-secondary/40 px-1 text-[11px]">403</code> — even if the key is leaked.</p>
          </div>
          <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Globe2 className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Domain Whitelist</h3>
            <p className="mt-2 text-sm text-muted-foreground">Restrict browser usage by Origin / Referer. Wildcards like <code className="rounded bg-secondary/40 px-1 text-[11px]">*.example.com</code> let you cover all subdomains in one rule.</p>
          </div>
          <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Gauge className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Rate Limiting</h3>
            <p className="mt-2 text-sm text-muted-foreground">Per-key throttling and category isolation prevent abuse and shield upstream providers from spikes — keeping your other clients fast.</p>
          </div>
          <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Lock className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Secure access</h3>
            <p className="mt-2 text-sm text-muted-foreground">HTTPS-only endpoints, signed payment callbacks, idempotent wallet credits and Postgres RLS so resellers only ever see their own data.</p>
          </div>
          <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">30-day validity</h3>
            <p className="mt-2 text-sm text-muted-foreground">Every reseller key is valid for exactly 30 days. Suspend, enable or delete anytime — admin controls remain in your hands.</p>
          </div>
          <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Activity className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Live request logs</h3>
            <p className="mt-2 text-sm text-muted-foreground">Every call is logged with status, latency, IP, host and error message. Filter by date and audit usage in seconds.</p>
          </div>
        </div>
      </section>

      {/* FEATURES grid */}
      <section id="features" className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {[
          { icon: KeyRound, t: "API Keys on demand", d: "Mint a 30-day key in seconds — coins auto-deducted from your wallet." },
          { icon: Wallet, t: "Wallet billing", d: "Top up via BondPay, see live balance and every coin transaction." },
          { icon: Server, t: "High-uptime proxy", d: "Cached upstream responses for blazing-fast reads with proper TTLs." },
          { icon: ShieldCheck, t: "Per-key controls", d: "Suspend, enable, regenerate or delete a key anytime." },
          { icon: Coins, t: "Transparent pricing", d: "1000 coins = ₹2000. 1 API key = 1000 coins. No hidden fees." },
          { icon: CheckCircle2, t: "Built for resellers", d: "Every reseller gets their own dashboard, keys, wallet and logs." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-xl border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Simple, coin-based pricing</h2>
          <p className="mt-3 text-muted-foreground">Pay only for keys you mint. No subscriptions.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-8 text-center" style={{ background: "var(--gradient-card)" }}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Coin rate</div>
            <div className="mt-3 text-4xl font-bold">₹2000</div>
            <div className="mt-1 text-sm text-muted-foreground">per 1000 coins</div>
            <ul className="mt-6 space-y-2 text-sm text-left">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Top up via BondPay</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Auto wallet credit on success</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> View pending / success / failed orders</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/40 p-8 text-center shadow-lg" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-glow)" }}>
            <div className="text-xs uppercase tracking-wider text-primary">Per API key</div>
            <div className="mt-3 text-4xl font-bold">1000 coins</div>
            <div className="mt-1 text-sm text-muted-foreground">≈ ₹2000 per key • valid 30 days</div>
            <ul className="mt-6 space-y-2 text-sm text-left">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> IP & domain whitelist</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Suspend / enable / delete anytime</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Live request logs & metrics</li>
            </ul>
            <Button asChild className="mt-6 w-full" size="lg"><Link to="/signup">Get started</Link></Button>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-4xl px-4 pb-16">
        <div className="rounded-2xl border border-border p-8 text-center" style={{ background: "var(--gradient-card)" }}>
          <h2 className="text-2xl font-semibold tracking-tight">Need help or a custom plan?</h2>
          <p className="mt-2 text-muted-foreground">Talk to us on Telegram — we usually reply within minutes.</p>
          <Button asChild size="lg" className="mt-5">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer">
              <Send className="mr-1.5 h-4 w-4" /> Message @{TELEGRAM} on Telegram
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 mt-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} Hyper Softs SaaS. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-4">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><Send className="h-3.5 w-3.5" /> @{TELEGRAM}</a>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
