import {
  Plug, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, ScrollText, Activity, BookOpen, LogOut, BarChart3,
  Shield, Menu, X, ChevronRight, Database, KeyRound, Wallet, Receipt, Settings, Coins, CreditCard, Webhook,
} from "lucide-react";
import { useState, type ReactNode } from "react";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; description?: string }

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, description: "Overview & stats" },
  { to: "/admin/users", label: "Users", icon: Users, description: "Resellers & wallets" },
  { to: "/admin/payments", label: "Top-up Payments", icon: CreditCard, description: "Wallet payment orders" },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt, description: "Coin activity" },
  { to: "/admin/clients", label: "API Clients", icon: KeyRound, description: "All keys" },
  { to: "/admin/logs", label: "Request Logs", icon: ScrollText, description: "Activity history" },
  { to: "/admin/callbacks", label: "Callbacks & Tokens", icon: Webhook, description: "Wallet callback logs" },
  { to: "/admin/integration", label: "Integration Config", icon: Plug, description: "Keys, TTL & token logs" },
  { to: "/admin/stats", label: "Statistics", icon: BarChart3, description: "Usage charts" },
  { to: "/admin/cache", label: "Cache Monitor", icon: Database, description: "Hit/miss & TTL" },
  { to: "/admin/health", label: "API Health", icon: Activity, description: "Test endpoints" },
  { to: "/admin/settings", label: "Settings", icon: Settings, description: "Pricing & config" },
  { to: "/admin/docs", label: "API Docs", icon: BookOpen, description: "Integration guide" },
];

const resellerNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Wallet & overview" },
  { to: "/dashboard/keys", label: "API Keys", icon: KeyRound, description: "Create & manage" },
  { to: "/dashboard/wallet", label: "Wallet", icon: Wallet, description: "Balance & top-up" },
  { to: "/dashboard/transactions", label: "Transactions", icon: Receipt, description: "Coin history" },
  { to: "/dashboard/logs", label: "Request Logs", icon: ScrollText, description: "API call history" },
  { to: "/dashboard/callbacks", label: "Callback Mode", icon: Webhook, description: "Token & wallet callbacks" },
  { to: "/dashboard/docs", label: "API Docs", icon: BookOpen, description: "Integration guide" },
];

export function AppShell({
  children,
  mode,
  walletBalance,
}: {
  children: ReactNode;
  mode: "admin" | "reseller";
  walletBalance?: number;
}) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = mode === "admin" ? adminNav : resellerNav;
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();
  const currentItem = items.find((i) => i.to === pathname) ?? items[0];

  const SidebarContent = () => (
    <>
      <div className="relative flex h-20 items-center gap-3 border-b border-border px-5">
        <div className="flex h-10 w-10 items-center justify-center border border-primary/60 bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-base font-bold uppercase leading-none tracking-tight">
            HYPER SOFTS
          </div>
          <div className="label-mono mt-1.5 truncate">
            {mode === "admin" ? "OPS · CONTROL PLANE" : "API · CONTROL PLANE"}
          </div>
        </div>
      </div>

      <nav className="scrollbar-slim flex-1 space-y-0.5 overflow-y-auto p-2.5">
        <div className="label-mono px-2.5 pb-2 pt-1">// navigation</div>
        {items.map((it) => {
          const Icon = it.icon;
          const active =
            pathname === it.to ||
            (it.to !== "/admin" && it.to !== "/dashboard" && pathname.startsWith(it.to));
          return (
            <Link
              key={it.to}
              to={it.to}
              preload="intent"
              onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 overflow-hidden border-l-2 px-3 py-2.5 text-sm transition-colors duration-150 ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-primary/40 hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <div
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center border transition-colors duration-150 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary/40 text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <div className="relative min-w-0 flex-1">
                <div className={`truncate text-[13px] uppercase leading-tight tracking-[0.06em] ${active ? "font-bold text-primary" : "font-medium"}`}>
                  {it.label}
                </div>
                {it.description && (
                  <div className="mt-0.5 truncate text-[10.5px] leading-tight text-muted-foreground/70">
                    {it.description}
                  </div>
                )}
              </div>
              {active && <span className="relative h-1.5 w-1.5 shrink-0 bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2.5">
        <div className="flex items-center gap-3 border border-border bg-secondary/30 p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/50 bg-primary/15 text-[11px] font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px]">{user?.email}</div>
            <div className="label-mono mt-0.5">
              {isAdmin ? "ROLE · ADMIN" : "ROLE · RESELLER"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundImage: "var(--gradient-mesh)" }}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card/90 backdrop-blur md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      <main className="md:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
            <span className="text-primary">{mode === "admin" ? "OPS" : "API"}</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate font-semibold">{currentItem.label}</span>
          </div>
          {mode === "reseller" && walletBalance !== undefined && (
            <div className="flex shrink-0 items-center gap-2 border border-primary/50 bg-primary/10 px-2.5 py-1 text-[11px]">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold text-primary tabular-nums">{walletBalance.toLocaleString()}</span>
              <span className="text-muted-foreground uppercase tracking-[0.16em]">coins</span>
            </div>
          )}
          <div className="hidden shrink-0 items-center gap-2 border border-border bg-secondary/30 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.18em] sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-primary" />
            </span>
            <span className="text-muted-foreground">System · Online</span>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
