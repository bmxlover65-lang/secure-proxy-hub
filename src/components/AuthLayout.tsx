import { Shield, Zap, Lock, BarChart3, Globe2 } from "lucide-react";
import type { ReactNode } from "react";
import { NetworkBackground } from "./NetworkBackground";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Animated network nodes background — full screen */}
      <NetworkBackground className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Color wash overlays */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--gradient-mesh)" }} />
      <div
        className="pointer-events-none absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[450px] w-[450px] rounded-full opacity-25 blur-[120px]"
        style={{ background: "var(--gradient-hero)" }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-base font-semibold tracking-tight">Reseller Panel</div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-border/40 bg-card/40 px-3 py-1.5 text-xs backdrop-blur-md sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-muted-foreground">All systems operational</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 grid min-h-[calc(100vh-80px)] grid-cols-1 gap-12 px-6 pb-12 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-16">
        {/* Left: marketing */}
        <div className="hidden flex-col gap-8 lg:flex">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
            <Globe2 className="h-3.5 w-3.5" />
            Global API Proxy Network
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Premium API access for{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              lottery game data
            </span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground">
            Manage API clients, monitor live traffic, and proxy requests securely with IP whitelisting and rate limiting — all from one dashboard.
          </p>
          <div className="grid max-w-md grid-cols-2 gap-3">
            {[
              { icon: Zap, label: "Lightning fast", desc: "< 200ms" },
              { icon: Lock, label: "IP whitelist", desc: "Per client" },
              { icon: BarChart3, label: "Live analytics", desc: "Real-time" },
              { icon: Shield, label: "Secure proxy", desc: "Token-based" },
            ].map((f) => (
              <div
                key={f.label}
                className="group rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-md transition-all hover:border-primary/40 hover:bg-card/60"
              >
                <div
                  className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <f.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="text-sm font-semibold">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form card */}
        <div className="flex w-full items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
