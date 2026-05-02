import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { NetworkBackground } from "@/components/NetworkBackground";
import {
  Shield, KeyRound, Activity, ShieldCheck, Coins, Wallet, Globe2,
  ArrowRight, CheckCircle2, Send, Sparkles, Zap, Lock, BarChart3,
  Clock, Users, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [
    { title: "Hyper Softs SaaS — API Reseller Platform with IP Whitelist & Rate Limiting" },
    { name: "description", content: "Premium API proxy for SASS lottery game resellers. IP whitelisting, domain locking, rate limiting, wallet billing & live request logs in one secure dashboard." },
    { name: "keywords", content: "API reseller platform, lottery API, SASS lottery, API proxy, IP whitelist, rate limiting, secure API access, wallet billing, API key management, reseller dashboard" },
    { name: "author", content: "Hyper Softs" },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: "Hyper Softs SaaS — Secure API Reseller Platform" },
    { property: "og:description", content: "Mint API keys, top up your wallet & monitor every call. IP whitelist, domain locking and rate limiting built in." },
    { property: "og:image", content: "/og-image.jpg" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Hyper Softs SaaS" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Hyper Softs SaaS — Secure API Reseller Platform" },
    { name: "twitter:description", content: "API keys, wallet billing, IP whitelist & live logs — built for resellers." },
    { name: "twitter:image", content: "/og-image.jpg" },
  ], links: [
    { rel: "canonical", href: "https://sass.hyperapi.in/" },
  ], scripts: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Hyper Softs SaaS",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "Secure API reseller platform with IP whitelist, rate limiting, wallet billing and live request logs.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        url: "https://sass.hyperapi.in/",
      }),
    },
  ] }),
});

const TELEGRAM = "Hyperdeveloperr";

function Index() {
  const { session, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) navigate({ to: isAdmin ? "/admin" : "/dashboard" });
  }, [loading, session, isAdmin, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Animated background */}
      <NetworkBackground className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--gradient-mesh)" }} />
      <div
        className="pointer-events-none absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div
        className="pointer-events-none absolute -right-32 top-1/2 h-[450px] w-[450px] rounded-full opacity-25 blur-[120px]"
        style={{ background: "var(--gradient-hero)" }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-primary/30"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="text-base font-semibold tracking-tight">Hyper Softs</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">SaaS Platform</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/apis" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:inline-flex">
              Game APIs
            </Link>
            <a
              href={`https://t.me/${TELEGRAM}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
            >
              <Send className="h-3.5 w-3.5" />
              @{TELEGRAM}
            </a>
            <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
            <Button asChild><Link to="/signup">Sign up</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 py-20 text-center md:py-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" /> Trusted by 200+ resellers worldwide
        </div>
        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          Premium API proxy for{" "}
          <span
            className="bg-clip-text font-serif italic text-transparent"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            SASS Lottery Game
          </span>{" "}
          resellers
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Sign up, top up your wallet, mint API keys on demand, and monitor every call — all from one beautifully crafted dashboard.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Link to="/signup">Get started free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer">
              <Send className="mr-1.5 h-4 w-4" /> Talk on Telegram
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: Users, v: "200+", l: "Resellers" },
            { icon: Zap, v: "<200ms", l: "Avg latency" },
            { icon: TrendingUp, v: "99.99%", l: "Uptime" },
            { icon: Clock, v: "24/7", l: "Monitoring" },
          ].map(({ icon: I, v, l }) => (
            <div key={l} className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-md">
              <I className="mx-auto mb-2 h-4 w-4 text-primary" />
              <div className="text-xl font-bold">{v}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-10 text-center">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">Everything you need</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Built for serious API resellers</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: KeyRound, t: "API Keys on demand", d: "Mint keys instantly — coins auto-deducted from your wallet." },
            { icon: Wallet, t: "Wallet & billing", d: "Top up coins, view every transaction, never overspend." },
            { icon: ShieldCheck, t: "IP & Domain whitelist", d: "Restrict every key to specific IPs and domains." },
            { icon: Activity, t: "Live request logs", d: "Every proxy call recorded with timing & errors." },
            { icon: Coins, t: "Transparent pricing", d: "Pay per key in coins — admin controls the rate." },
            { icon: CheckCircle2, t: "Reseller dashboards", d: "Each reseller gets their own keys, wallet & analytics." },
          ].map(({ icon: Icon, t, d }) => (
            <div
              key={t}
              className="group rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/60"
              style={{ boxShadow: "var(--shadow-elegant)" }}
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Reseller Value Proposition */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-10 text-center">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">Why resellers choose us</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Secure API access, built for{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>scale</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Every API key is locked down with enterprise-grade controls — IP whitelist, domain locking, and per-key rate limiting — so your business stays safe and predictable.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* IP Whitelist */}
          <div
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-7 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-primary/30" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold">IP Whitelist</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Restrict every API key to specific server IPs. Requests from unknown sources are rejected at the edge — before they ever hit your billing.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Multiple IPs per key", "CIDR range support", "Edge-level enforcement"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Rate Limiting */}
          <div
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-7 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
              style={{ background: "var(--gradient-hero)" }}
            />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-primary/30" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}>
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Smart Rate Limiting</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Per-key throttling protects your wallet from runaway scripts and abusive clients. Set sensible quotas and sleep easy at night.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Per-second & per-minute limits", "Burst protection", "Auto block on abuse"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Secure Access */}
          <div
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-7 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-primary/30" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Secure Access</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              HTTPS-only proxy with token-based authentication, domain locking, and rotating keys. Your upstream credentials never leak to the client.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {["End-to-end TLS encryption", "Domain referer locking", "Instant key revocation"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          {[
            { icon: BarChart3, t: "Real-time analytics" },
            { icon: Globe2, t: "Global edge network" },
            { icon: Shield, t: "DDoS protection" },
            { icon: Activity, t: "99.99% uptime SLA" },
          ].map(({ icon: I, t }) => (
            <div key={t} className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/40 px-3 py-1.5 backdrop-blur-md">
              <I className="h-3.5 w-3.5 text-primary" /> {t}
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-20">
        <div
          className="relative overflow-hidden rounded-3xl border border-primary/30 p-8 text-center md:p-12"
          style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}
        >
          <div
            className="pointer-events-none absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full opacity-30 blur-[80px]"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-primary/30" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Send className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Need help? Talk to us on Telegram</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Got questions about pricing, API access, or reseller onboarding? Message us directly — we usually reply within minutes.
            </p>
            <a
              href={`https://t.me/${TELEGRAM}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Send className="h-4 w-4" />
              @{TELEGRAM}
              <ArrowRight className="h-4 w-4" />
            </a>
            <div className="mt-4 text-xs text-muted-foreground">Tap to open Telegram</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} Hyper Softs SaaS. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
              <Send className="h-3.5 w-3.5" /> @{TELEGRAM}
            </a>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
