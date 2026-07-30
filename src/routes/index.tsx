import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { NetworkBackground } from "@/components/NetworkBackground";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shield, KeyRound, Activity, ShieldCheck, Coins, Wallet, Globe2,
  ArrowRight, CheckCircle2, Send, Lock, Gauge, Network, Server, Clock, Sparkles, Zap, HelpCircle,
  LayoutDashboard, BookOpen,
} from "lucide-react";

const TELEGRAM = "Hyperdeveloperr";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What does “30-day fixed validity” mean for an API key?",
    a: "Every reseller API key you mint is valid for exactly 30 days from the moment it is created. After 30 days the key automatically stops working — there is no auto-renewal and no partial refund. To continue using the API, simply mint a new key for 1000 coins (₹2000).",
  },
  {
    q: "How does IP whitelisting work?",
    a: "Each API key can be locked to one or more source IP addresses. When a request hits our proxy, we check the caller's IP against your whitelist and reject anything that doesn't match with HTTP 403 — even if the API key itself is correct. This protects you if the key is ever leaked.",
  },
  {
    q: "How is domain whitelisting different?",
    a: "Domain whitelisting restricts browser-based usage by checking the request's Origin and Referer headers. You can list exact domains (api.example.com) or use wildcards like *.example.com to cover all subdomains. Combine IP and domain whitelists for defense in depth.",
  },
  {
    q: "How do reseller keys actually work?",
    a: "Sign up, top up your wallet using BondPay, then mint API keys on demand. Each key costs 1000 coins (₹2000) and gives you 30 days of access to our proxy. You can suspend, enable, regenerate, or delete any key at any time from your dashboard, and every request is logged with status, latency, IP and host.",
  },
  {
    q: "What is the pricing — 1000 coins = ₹2000?",
    a: "Yes. The flat rate is 1000 coins for ₹2000. One API key consumes 1000 coins, so the effective cost per 30-day key is ₹2000. There are no monthly subscriptions, no hidden fees and no per-request charges beyond your rate-limit tier.",
  },
  {
    q: "What happens after a successful wallet top-up?",
    a: "Our payment callback verifies the signature and amount against the original order, then atomically credits your wallet — so duplicate or retried callbacks can never double-credit. Successful, pending and failed orders are visible on your wallet page.",
  },
];

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Hyper Softs SaaS — Reseller API Proxy | IP Whitelist & Wallet Billing" },
      { name: "description", content: "Hyper Softs (HyperShots / HyperAPI) is a secure reseller API proxy: per-key IP whitelist, domain whitelist, rate limiting, coin wallet billing, 30-day fixed key validity and live request logs. Flat rate 1000 coins = ₹2000." },
      { name: "keywords", content: "hyper softs, hypersofts, hypershots, hyper softs saas, hyperapi, sass.hyperapi.in, reseller api, api proxy, ip whitelist api, domain whitelist, rate limiting, wallet billing, secure api access, 30 day api key, lottery game api reseller, wingo api, saas api gateway" },
      { name: "robots", content: "index,follow" },
      { name: "googlebot", content: "index,follow,max-image-preview:large,max-snippet:-1" },
      { name: "application-name", content: "Hyper Softs SaaS" },
      { name: "apple-mobile-web-app-title", content: "Hyper Softs" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "format-detection", content: "telephone=no" },
      { name: "author", content: "Hyper Softs" },
      { name: "publisher", content: "Hyper Softs" },
      { name: "theme-color", content: "#08090b" },
      { httpEquiv: "Content-Language", content: "en" },
      { property: "og:title", content: "Hyper Softs SaaS — Secure Reseller API Proxy" },
      { property: "og:description", content: "Per-key IP & domain whitelist, rate limiting, wallet billing and 30-day fixed-validity API keys for SaaS and lottery-game resellers. 1000 coins = ₹2000." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Hyper Softs SaaS" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: "https://sass.hyperapi.in/" },
      { property: "og:image", content: "https://sass.hyperapi.in/og-hero.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Hyper Softs SaaS — secure reseller API proxy dashboard" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hyper Softs SaaS — Reseller API Proxy" },
      { name: "twitter:description", content: "Secure API proxy built for resellers — IP whitelist, domain whitelist, rate limiting, wallet billing and 30-day API keys." },
      { name: "twitter:image", content: "https://sass.hyperapi.in/og-hero.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://sass.hyperapi.in/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Hyper Softs",
              alternateName: ["Hyper Softs SaaS", "HyperSofts", "HyperShots", "HyperAPI"],
              url: "https://sass.hyperapi.in/",
              logo: "https://sass.hyperapi.in/og-hero.jpg",
              sameAs: ["https://t.me/Hyperdeveloperr"],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: "https://t.me/Hyperdeveloperr",
                availableLanguage: ["en", "hi"],
              },
            },
            {
              "@type": "WebSite",
              url: "https://sass.hyperapi.in/",
              name: "Hyper Softs SaaS",
              alternateName: "HyperSofts SaaS Platform",
              inLanguage: "en",
            },
            {
              "@type": "Product",
              name: "Hyper Softs Reseller API Key",
              description: "30-day reseller API key with IP whitelist, domain whitelist, rate limiting and wallet billing.",
              brand: { "@type": "Brand", name: "Hyper Softs" },
              offers: {
                "@type": "Offer",
                price: "2000",
                priceCurrency: "INR",
                availability: "https://schema.org/InStock",
                url: "https://sass.hyperapi.in/#pricing",
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
            { "@type": "ImageObject", name: "Hyper Softs SaaS", contentUrl: "https://sass.hyperapi.in/og-hero.jpg" },
            { "@type": "ImageObject", name: "Enterprise Security for Resellers", contentUrl: "https://sass.hyperapi.in/og-security.jpg" },
            { "@type": "ImageObject", name: "Simple Pricing — 1000 coins = ₹2000", contentUrl: "https://sass.hyperapi.in/og-pricing.jpg" },
            { "@type": "ImageObject", name: "FAQ", contentUrl: "https://sass.hyperapi.in/og-faq.jpg" },
            { "@type": "ImageObject", name: "Talk on Telegram", contentUrl: "https://sass.hyperapi.in/og-contact.jpg" },
          ],
        }),
      },
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
    <div className="relative min-h-screen text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-background"
        style={{ backgroundImage: "var(--gradient-mesh)" }}
      />
      <div aria-hidden="true" className="grid-lines pointer-events-none fixed inset-0 -z-10 opacity-[0.28]" />
      <NetworkBackground className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-30" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            aria-label="Hyper Softs SaaS — Home"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex h-9 w-9 items-center justify-center border border-primary bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" aria-hidden="true" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-bold uppercase tracking-tight">Hyper Softs</span>
              <span className="label-mono mt-1">SaaS · Control Plane</span>
            </div>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:flex">
            {[
              { href: "#security", label: "Security" },
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {l.label}
              </a>
            ))}
            <a
              href={`https://t.me/${TELEGRAM}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Contact Hyper Softs on Telegram, @${TELEGRAM}`}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs hover:text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Send className="h-3 w-3" aria-hidden="true" /> @{TELEGRAM}
            </a>
          </nav>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Login</Link></Button>
            <Button asChild size="sm"><Link to="/signup">Sign up</Link></Button>
          </div>
        </div>
      </header>

      <main id="main">
      {/* HERO */}
      <section aria-labelledby="hero-heading" className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pt-14">
        {/* status rail */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-border bg-card/60 px-3 py-2 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-primary">
            <span className="h-1.5 w-1.5 animate-pulse bg-primary" /> System · Online
          </span>
          <span className="text-border">|</span>
          <span>Node · IN-BOM-1</span>
          <span className="text-border">|</span>
          <span>Proxy · sass.hyperapi.in</span>
          <span className="ml-auto border border-primary/50 bg-primary/10 px-2 py-0.5 text-primary">99.9% Uptime</span>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 border border-border bg-secondary/40 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> CH.00 · Reseller API Infrastructure
            </div>
            <h1 id="hero-heading" className="font-display mt-6 text-balance text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
              API access,
              <br />
              <span className="text-primary">engineered</span> for resellers.
            </h1>
            <p className="mt-6 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              Hyper Softs runs the proxy layer for SaaS &amp; lottery-game resellers — coin-based
              wallet billing, per-key IP and domain whitelists, hard rate limits and 30-day fixed
              key validity. One HTTP call. Zero bloat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-none uppercase tracking-[0.12em]">
                <Link to="/signup">Open Dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-none uppercase tracking-[0.12em]">
                <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer">
                  <Send className="mr-1.5 h-4 w-4" /> Request Access
                </a>
              </Button>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6">
              {[
                { v: "30 DAYS", l: "Fixed key validity" },
                { v: "SHA-256", l: "Hashed API keys" },
                { v: "IP + DOMAIN", l: "Per-key whitelist" },
                { v: "₹2000", l: "Per 1000 coins" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-primary/70 pl-3">
                  <dt className="font-display text-base font-bold tracking-tight text-primary">{s.v}</dt>
                  <dd className="label-mono mt-1">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* terminal panel */}
          <div className="bracket-frame">
            <div className="border border-border" style={{ background: "var(--gradient-card)" }}>
              <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="text-primary">&gt;_</span>
                <span>hypersofts@prod ~ proxy-call</span>
                <span className="ml-auto text-primary">200 OK</span>
              </div>
              <pre className="overflow-x-auto px-3 py-4 text-[11.5px] leading-relaxed text-muted-foreground sm:text-xs">
{`$ curl -s \\
  "https://sass.hyperapi.in/api/public/proxy?\\
   api_key=hs_live_••••••••&\\
   category=wingo&game=30s&type=sametrend"

`}<span className="text-primary">{`→ 4`}</span>
              </pre>
              <div className="grid grid-cols-3 border-t border-border text-[10px] uppercase tracking-[0.16em]">
                <div className="border-r border-border px-3 py-2">
                  <div className="text-muted-foreground">Latency</div>
                  <div className="mt-1 font-semibold text-foreground">118ms</div>
                </div>
                <div className="border-r border-border px-3 py-2">
                  <div className="text-muted-foreground">Cost</div>
                  <div className="mt-1 font-semibold text-foreground">0 coins</div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-muted-foreground">State</div>
                  <div className="mt-1 font-semibold text-primary">Delivered</div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> 30-day keys</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> 1000 coins = ₹2000</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Auto wallet credit</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACCESS CTA */}
      <section aria-labelledby="quick-access-heading" className="mx-auto max-w-6xl px-4 pb-10">
        <div className="border border-border" style={{ background: "var(--gradient-card)" }}>
          <div className="label-mono border-b border-border px-4 py-2">// workspace access</div>
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-7">
            <div className="min-w-0">
              <h2 id="quick-access-heading" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Your <span className="text-primary">reseller workspace</span>
              </h2>
              <p className="mt-2 max-w-lg text-[13px] text-muted-foreground">
                Manage keys, monitor live usage, and read the integration docs — all in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:shrink-0">
              <Button asChild size="lg" className="rounded-none uppercase tracking-[0.12em]">
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" aria-hidden="true" /> Reseller Panel
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-none uppercase tracking-[0.12em]">
                <Link to="/dashboard/docs">
                  <BookOpen className="mr-1.5 h-4 w-4" aria-hidden="true" /> API Docs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROP — security & control */}
      <section id="security" aria-labelledby="security-heading" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-8 text-center">
          <h2 id="security-heading" className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Enterprise-grade{" "}
            <span className="text-primary">
              security
            </span>{" "}
            &amp; control
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Every API key you mint is protected by enterprise-grade controls — out of the box.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-none border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary/10 text-primary"><Network className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">IP Whitelist</h3>
            <p className="mt-2 text-sm text-muted-foreground">Lock each API key to one or many source IPs. Requests from unknown IPs are rejected with <code className="rounded bg-secondary/40 px-1 text-[11px]">403</code> — even if the key is leaked.</p>
          </div>
          <div className="rounded-none border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary/10 text-primary"><Globe2 className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Domain Whitelist</h3>
            <p className="mt-2 text-sm text-muted-foreground">Restrict browser usage by Origin / Referer. Wildcards like <code className="rounded bg-secondary/40 px-1 text-[11px]">*.example.com</code> let you cover all subdomains in one rule.</p>
          </div>
          <div className="rounded-none border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary/10 text-primary"><Gauge className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Rate Limiting</h3>
            <p className="mt-2 text-sm text-muted-foreground">Per-key throttling and category isolation prevent abuse and shield upstream providers from spikes — keeping your other clients fast.</p>
          </div>
          <div className="rounded-none border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary/10 text-primary"><Lock className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Secure access</h3>
            <p className="mt-2 text-sm text-muted-foreground">HTTPS-only endpoints, signed payment callbacks, idempotent wallet credits and Postgres RLS so resellers only ever see their own data.</p>
          </div>
          <div className="rounded-none border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">30-day validity</h3>
            <p className="mt-2 text-sm text-muted-foreground">Every reseller key is valid for exactly 30 days. Suspend, enable or delete anytime — admin controls remain in your hands.</p>
          </div>
          <div className="rounded-none border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary/10 text-primary"><Activity className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">Live request logs</h3>
            <p className="mt-2 text-sm text-muted-foreground">Every call is logged with status, latency, IP, host and error message. Filter by date and audit usage in seconds.</p>
          </div>
        </div>
      </section>

      {/* FEATURES grid */}
      <section id="features" aria-labelledby="features-heading" className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="features-heading" className="sr-only">Reseller API features</h2>
        <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: KeyRound, t: "API Keys on demand", d: "Mint a 30-day key in seconds — coins auto-deducted from your wallet." },
          { icon: Wallet, t: "Wallet billing", d: "Top up via BondPay, see live balance and every coin transaction." },
          { icon: Server, t: "High-uptime proxy", d: "Cached upstream responses for blazing-fast reads with proper TTLs." },
          { icon: ShieldCheck, t: "Per-key controls", d: "Suspend, enable, regenerate or delete a key anytime." },
          { icon: Coins, t: "Transparent pricing", d: "1000 coins = ₹2000. 1 API key = 1000 coins. No hidden fees." },
          { icon: CheckCircle2, t: "Built for resellers", d: "Every reseller gets their own dashboard, keys, wallet and logs." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-none border border-border p-6" style={{ background: "var(--gradient-card)" }}>
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" aria-labelledby="pricing-heading" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-none border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Coins className="h-3.5 w-3.5" aria-hidden="true" /> Pay-as-you-go • No subscription
          </div>
          <h2 id="pricing-heading" className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Simple,{" "}
            <span className="text-primary">
              transparent
            </span>{" "}
            pricing
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            One flat rate: <span className="font-semibold text-foreground">1000 coins = ₹2000</span>.
            Every API key costs <span className="font-semibold text-foreground">1000 coins</span> and is valid for a fixed
            <span className="font-semibold text-foreground"> 30 days</span> — no auto-renewals, no surprises.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* Starter */}
          <div className="flex flex-col rounded-none border border-border p-7" style={{ background: "var(--gradient-card)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Starter</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">₹2,000</span>
              <span className="text-sm text-muted-foreground">/ 1,000 coins</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">1 API key • 30-day fixed validity</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {["1 reseller API key", "30-day fixed validity", "IP & domain whitelist", "Live request logs", "Telegram support"].map((f) => (
                <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-7 w-full"><Link to="/signup">Start with Starter</Link></Button>
          </div>

          {/* Growth (popular) */}
          <div className="relative flex flex-col rounded-none border-2 border-primary/60 p-7" style={{ background: "var(--gradient-card)" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-none bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Most popular
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Growth</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">₹10,000</span>
              <span className="text-sm text-muted-foreground">/ 5,000 coins</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">5 API keys • each valid 30 days</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {["5 reseller API keys", "30-day fixed validity per key", "IP & domain whitelist", "Per-key rate limiting", "Usage metrics & analytics", "Priority Telegram support"].map((f) => (
                <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</li>
              ))}
            </ul>
            <Button asChild className="mt-7 w-full" size="lg"><Link to="/signup">Get Growth</Link></Button>
          </div>

          {/* Scale */}
          <div className="flex flex-col rounded-none border border-border p-7" style={{ background: "var(--gradient-card)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scale</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">₹20,000</span>
              <span className="text-sm text-muted-foreground">/ 10,000 coins</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">10 API keys • each valid 30 days</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {["10 reseller API keys", "30-day fixed validity per key", "IP & domain whitelist", "Higher rate limits", "Full audit logs & exports", "Dedicated Telegram channel"].map((f) => (
                <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-7 w-full"><Link to="/signup">Choose Scale</Link></Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          All plans share the same rate (1000 coins = ₹2000) — buy any amount of coins from your wallet anytime.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-heading" className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-none border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> Frequently asked questions
          </div>
          <h2 id="faq-heading" className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Questions{" "}
            <span className="text-primary">
              answered
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Everything you need to know about 30-day fixed validity, IP &amp; domain whitelisting, and how Hyper Softs reseller keys work.
          </p>
        </div>
        <Accordion type="single" collapsible className="rounded-none border border-border" style={{ background: "var(--gradient-card)" }}>
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="border-b border-border/60 last:border-b-0">
              <AccordionTrigger className="px-5 text-left text-base font-semibold hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="px-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CONTACT / TELEGRAM CTA */}
      <section id="contact" aria-labelledby="contact-heading" className="mx-auto max-w-5xl px-4 pb-20">
        <div
          className="relative overflow-hidden rounded-none border border-primary/30 p-10 text-center md:p-14"
          style={{ background: "var(--gradient-card)" }}
        >
          <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-none" style={{ background: "var(--gradient-primary)" }}>
            <Send className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h2 id="contact-heading" className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Talk to us{" "}
            <span className="text-primary">
              on Telegram
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Custom plans, bulk coins, integration help or anything else — message us directly.
            We typically reply within <span className="font-semibold text-foreground">a few minutes</span>.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" >
              <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer" aria-label={`Message Hyper Softs on Telegram, @${TELEGRAM}`}>
                <Send className="mr-1.5 h-4 w-4" aria-hidden="true" /> Message @{TELEGRAM}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signup">Create free account <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" /></Link>
            </Button>
          </div>

          {/* Trust badges */}
          <ul aria-label="Trust signals" className="mx-auto mt-10 grid max-w-3xl grid-cols-2 list-none gap-3 text-sm md:grid-cols-4">
            {[
              { icon: Zap, l: "Replies in minutes" },
              { icon: ShieldCheck, l: "Verified account" },
              { icon: Lock, l: "Secure & private" },
              { icon: Clock, l: "Available 24/7" },
            ].map(({ icon: Icon, l }) => (
              <li key={l} className="flex items-center justify-center gap-2 rounded-none border border-border/60 bg-background/40 px-3 py-2.5 text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-medium">{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </main>

      <footer className="border-t border-border/60 mt-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} Hyper Softs SaaS. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-4">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer" aria-label={`Telegram @${TELEGRAM}`} className="inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"><Send className="h-3.5 w-3.5" aria-hidden="true" /> @{TELEGRAM}</a>
            <Link to="/privacy" className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Privacy</Link>
            <Link to="/terms" className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
