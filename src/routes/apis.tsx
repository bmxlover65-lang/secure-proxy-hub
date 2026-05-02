import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { NetworkBackground } from "@/components/NetworkBackground";
import {
  Shield, Send, ArrowRight, CheckCircle2, Sparkles, Zap, Trophy,
  Dice5, Car, Coins, Activity, Globe2,
} from "lucide-react";

export const Route = createFileRoute("/apis")({
  component: ApisPage,
  head: () => ({ meta: [
    { title: "Lottery Game APIs — Wingo, K3, 5D, TRX, Moto Racing | Hyper Softs SaaS" },
    { name: "description", content: "Buy reseller API access for Wingo, K3, 5D, TRX Hash and Moto Racing. Real-time results, IP whitelist, rate limiting & 99.99% uptime. Contact on Telegram." },
    { name: "keywords", content: "Wingo API, K3 lottery API, 5D lottery API, TRX hash API, Moto Racing API, lottery game API reseller, SASS lottery, color prediction API" },
    { property: "og:title", content: "Lottery Game APIs — Wingo, K3, 5D, TRX, Moto Racing" },
    { property: "og:description", content: "Premium reseller API access to all major lottery games. Contact us on Telegram @Hyperdeveloperr." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://sass.hyperapi.in/apis" },
  ], links: [{ rel: "canonical", href: "https://sass.hyperapi.in/apis" }] }),
});

const TELEGRAM = "Hyperdeveloperr";
const SITE = "sass.hyperapi.in";

const GAMES = [
  {
    name: "Wingo",
    tagline: "Color & number prediction",
    icon: Sparkles,
    accent: "from-pink-500 to-rose-500",
    rounds: "Every 1 / 3 / 5 / 10 min",
    features: ["Live period & countdown", "Result + color + big/small", "Historical data API"],
  },
  {
    name: "K3 Lotre",
    tagline: "3-dice classic lottery",
    icon: Dice5,
    accent: "from-amber-500 to-orange-500",
    rounds: "Every 1 / 3 / 5 / 10 min",
    features: ["Sum, triple, pair detection", "All bet outcomes", "Real-time draw feed"],
  },
  {
    name: "5D Lotre",
    tagline: "5-digit lottery game",
    icon: Trophy,
    accent: "from-violet-500 to-purple-500",
    rounds: "Every 1 / 3 / 5 / 10 min",
    features: ["Per-digit results A–E", "Sum & big/small/odd/even", "Period history"],
  },
  {
    name: "TRX Hash",
    tagline: "Provably fair on TRON chain",
    icon: Zap,
    accent: "from-emerald-500 to-teal-500",
    rounds: "Every 1 min, on-chain",
    features: ["Block hash verified", "Tamper-proof results", "TRX address & block info"],
  },
  {
    name: "Moto Racing",
    tagline: "Live racing prediction",
    icon: Car,
    accent: "from-blue-500 to-cyan-500",
    rounds: "Continuous live races",
    features: ["Race winners & odds", "Position-wise results", "Live race state"],
  },
];

function ApisPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <NetworkBackground className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--gradient-mesh)" }} />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]" style={{ background: "var(--gradient-primary)" }} />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-[450px] w-[450px] rounded-full opacity-25 blur-[120px]" style={{ background: "var(--gradient-hero)" }} />

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-primary/30" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="text-base font-semibold tracking-tight">Hyper Softs</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">SaaS Platform</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex">
              <Send className="h-3.5 w-3.5" /> @{TELEGRAM}
            </a>
            <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
            <Button asChild><Link to="/signup">Sign up</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 py-16 text-center md:py-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
          <Globe2 className="h-3.5 w-3.5" /> SASS Lottery Game APIs · Reseller Marketplace
        </div>
        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          One API key.{" "}
          <span className="bg-clip-text font-serif italic text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
            Every popular game.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Sell live game data for <strong className="text-foreground">Wingo, K3, 5D, TRX Hash &amp; Moto Racing</strong> from one secure dashboard. IP-locked, rate-limited, and lightning fast.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer">
              <Send className="mr-1.5 h-4 w-4" /> Buy on Telegram
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6">
            <Link to="/signup">Open dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-5 text-xs text-muted-foreground">
          Live at <a href={`https://${SITE}`} className="font-semibold text-primary hover:underline">{SITE}</a>
        </div>
      </section>

      {/* Games grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-10 text-center">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">Available Game APIs</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">5 premium games, one platform</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <div
              key={g.name}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40"
              style={{ boxShadow: "var(--shadow-elegant)" }}
            >
              <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${g.accent} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
              <div className="relative">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${g.accent} shadow-lg`}>
                  <g.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl font-bold tracking-tight">{g.name}</h3>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-success">Live</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{g.tagline}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  <Activity className="h-3 w-3" /> {g.rounds}
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {g.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Bundle card */}
          <div
            className="group relative overflow-hidden rounded-2xl border-2 border-primary/40 p-6 backdrop-blur-md"
            style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-glow)" }}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-2xl" style={{ background: "var(--gradient-primary)" }} />
            <div className="relative flex h-full flex-col">
              <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Best value
              </div>
              <h3 className="text-2xl font-bold tracking-tight">All-Games Bundle</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get every game above under a single API key — perfect for resellers running multi-game platforms.</p>
              <ul className="mt-4 space-y-2 text-sm">
                {["All 5 games included", "Single key, single bill", "Priority support on Telegram", "30-day validity, renewable"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 h-11 w-full font-semibold" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer">
                  <Send className="mr-1.5 h-4 w-4" /> Get pricing on Telegram
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why us strip */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, t: "<200ms latency", d: "Edge-cached responses" },
            { icon: Shield, t: "IP & domain locked", d: "Per-key whitelisting" },
            { icon: Coins, t: "Wallet billing", d: "Pay only for what you use" },
            { icon: Activity, t: "99.99% uptime", d: "24/7 monitoring" },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-md">
              <I className="mb-2 h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">{t}</div>
              <div className="text-xs text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 p-8 text-center md:p-12" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}>
          <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full opacity-30 blur-[80px]" style={{ background: "var(--gradient-primary)" }} />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-primary/30" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Send className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to start reselling?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              DM us on Telegram for pricing, demo keys, and onboarding. We reply within minutes.
            </p>
            <a
              href={`https://t.me/${TELEGRAM}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Send className="h-4 w-4" /> @{TELEGRAM} <ArrowRight className="h-4 w-4" />
            </a>
            <div className="mt-4 text-xs text-muted-foreground">
              Site: <a href={`https://${SITE}`} className="font-semibold text-primary hover:underline">{SITE}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} Hyper Softs SaaS · {SITE}</div>
          <div className="flex items-center gap-4">
            <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
              <Send className="h-3.5 w-3.5" /> @{TELEGRAM}
            </a>
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/login" className="hover:text-foreground">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
