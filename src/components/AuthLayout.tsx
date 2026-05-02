import { Shield, Zap, Lock, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2" style={{ backgroundImage: "var(--gradient-mesh)" }}>
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "var(--gradient-mesh)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="text-lg font-semibold text-white">Reseller Panel</div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="max-w-md text-4xl font-bold leading-tight text-white">
            Premium API access for your <span className="text-white/80">lottery game data</span>
          </h2>
          <p className="max-w-md text-white/80">
            Manage resellers, monitor live traffic, and proxy requests securely with IP whitelisting and rate limiting.
          </p>
          <div className="grid max-w-md grid-cols-2 gap-3 pt-2">
            {[
              { icon: Zap, label: "Lightning fast" },
              { icon: Lock, label: "IP whitelist" },
              { icon: BarChart3, label: "Live analytics" },
              { icon: Shield, label: "Secure proxy" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white backdrop-blur">
                <f.icon className="h-4 w-4" />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} Reseller Panel. All rights reserved.</div>
      </div>

      {/* Right: form */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-lg font-semibold">Reseller Panel</div>
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
