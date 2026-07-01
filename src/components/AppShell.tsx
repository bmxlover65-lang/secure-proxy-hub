import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, ScrollText, Activity, BookOpen, LogOut, BarChart3,
  Shield, Menu, X, ChevronRight, Database, KeyRound, Wallet, Receipt, Settings, Coins, CreditCard,
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
      <div className="relative flex h-20 items-center gap-3 border-b border-border/60 px-5">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-primary/30"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5 leading-tight">
            <span className="text-base font-semibold tracking-tight">Hyper</span>
            <span
              className="font-cursive bg-clip-text text-transparent text-2xl leading-none"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Softs
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">SaaS</span>
          </div>
          <div
            className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
          >
            <span className="h-1 w-1 rounded-full bg-primary" />
            {mode}
          </div>
        </div>
      </div>

      <nav className="scrollbar-slim flex-1 space-y-1.5 overflow-y-auto p-3">
        <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
          Navigation
        </div>
        {items.map((it) => {
          const Icon = it.icon;
          const active =
            pathname === it.to ||
            (it.to !== "/admin" && it.to !== "/dashboard" && pathname.startsWith(it.to));
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                active
                  ? "bg-primary/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.2)] ring-1 ring-primary/20"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {active && (
                <>
                  <span
                    className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full"
                    style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                  />
                  <span
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{ background: "linear-gradient(90deg, hsl(var(--primary)/0.12), transparent 70%)" }}
                  />
                </>
              )}
              <div
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                  active
                    ? "text-primary-foreground shadow-[0_4px_14px_hsl(var(--primary)/0.4)]"
                    : "bg-secondary/40 text-muted-foreground group-hover:bg-secondary/80 group-hover:text-foreground"
                }`}
                style={active ? { background: "var(--gradient-primary)" } : undefined}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 2} />
              </div>
              <div className="relative min-w-0 flex-1">
                <div className={`truncate text-sm leading-tight ${active ? "font-semibold" : "font-medium"}`}>
                  {it.label}
                </div>
                {it.description && (
                  <div className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground/80">
                    {it.description}
                  </div>
                )}
              </div>
              {active && (
                <ChevronRight className="relative h-4 w-4 shrink-0 text-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user?.email}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {isAdmin ? "Administrator" : "User"}
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border/60 bg-card/80 backdrop-blur md:flex md:flex-col">
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex flex-1 items-center gap-2 text-sm">
            <span className="text-muted-foreground capitalize">{mode}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="font-medium">{currentItem.label}</span>
          </div>
          {mode === "reseller" && walletBalance !== undefined && (
            <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-foreground">{walletBalance.toLocaleString()}</span>
              <span className="text-muted-foreground">coins</span>
            </div>
          )}
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-muted-foreground">System Online</span>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
