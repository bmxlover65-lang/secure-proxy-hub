import { Shield, Lock, Gauge, Clock, Network, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

const SPECS = [
  { icon: Lock, k: "IP + DOMAIN", v: "Per-key whitelist" },
  { icon: Gauge, k: "RATE LIMITS", v: "Per-key throttling" },
  { icon: Clock, k: "30 DAYS", v: "Fixed key validity" },
  { icon: Network, k: "SHA-256", v: "Hashed API keys" },
];

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 md:px-10">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold uppercase tracking-[0.16em]">Hyper Softs</div>
            <div className="label-mono text-[0.6rem] text-muted-foreground">SaaS · Control Plane</div>
          </div>
        </Link>
        <div className="flex items-center gap-2 border border-border px-2.5 py-1.5">
          <span className="h-2 w-2 shrink-0 bg-primary" />
          <span className="label-mono text-[0.6rem] text-muted-foreground">System · Online</span>
        </div>
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-69px)] grid-cols-1 gap-10 px-4 py-10 sm:px-6 md:px-10 lg:grid-cols-[1.05fr_minmax(0,26rem)] lg:items-center lg:gap-16 lg:px-16">
        {/* Left: schematic marketing rail */}
        <div className="hidden flex-col gap-8 lg:flex">
          <div className="label-mono w-fit border border-primary/40 px-2.5 py-1 text-[0.62rem] text-primary">
            // Reseller API infrastructure
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
            API access,{" "}
            <span className="text-primary">engineered</span> for resellers.
          </h1>
          <p className="max-w-md font-mono text-sm leading-relaxed text-muted-foreground">
            Coin-based wallet billing, per-key IP and domain whitelists, hard rate
            limits and 30-day fixed key validity. One HTTP call. Zero bloat.
          </p>
          <div className="grid max-w-lg grid-cols-2 border border-border">
            {SPECS.map((s, i) => (
              <div
                key={s.k}
                className={`flex items-start gap-3 p-4 ${i % 2 === 0 ? "border-r border-border" : ""} ${i < 2 ? "border-b border-border" : ""}`}
              >
                <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold tracking-tight">{s.k}</div>
                  <div className="label-mono truncate text-[0.6rem] text-muted-foreground">{s.v}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border bg-card/60">
            <div className="label-mono border-b border-border px-3 py-2 text-[0.6rem] text-muted-foreground">
              &gt;_ hypersofts@prod ~ auth
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-muted-foreground">
{`$ curl -s "https://sass.hyperapi.in/api/public/proxy?\\
   api_key=hs_live_********&\\
   category=wingo&game=30s&type=sametrend"
`}<span className="text-primary">→ 4</span>
            </pre>
          </div>
        </div>

        {/* Right: form panel */}
        <div className="flex w-full items-center justify-center">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="label-mono mb-5 inline-flex items-center gap-2 text-[0.62rem] text-muted-foreground transition-colors hover:text-primary lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to home
            </Link>
            <div className="mb-5 border-l-2 border-primary pl-4">
              <h2 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">{title}</h2>
              <p className="mt-1.5 font-mono text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
