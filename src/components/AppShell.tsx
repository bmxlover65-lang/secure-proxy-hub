import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, ScrollText, Activity, BookOpen, LogOut, Shield, KeyRound } from "lucide-react";
import type { ReactNode } from "react";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; }

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/resellers", label: "Resellers", icon: Users },
  { to: "/admin/logs", label: "Request Logs", icon: ScrollText },
  { to: "/admin/health", label: "API Health", icon: Activity },
];

const resellerNav: NavItem[] = [
  { to: "/reseller", label: "Overview", icon: KeyRound },
  { to: "/reseller/docs", label: "API Docs", icon: BookOpen },
];

export function AppShell({ children, mode }: { children: ReactNode; mode: "admin" | "reseller" }) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = mode === "admin" ? adminNav : resellerNav;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">Reseller Panel</div>
            <div className="text-xs text-muted-foreground capitalize">{mode}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to || (it.to !== "/admin" && it.to !== "/reseller" && pathname.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          {isAdmin && mode === "reseller" && (
            <Link to="/admin" className="mb-2 block text-xs text-primary hover:underline">
              Switch to Admin →
            </Link>
          )}
          {!isAdmin && mode === "admin" ? null : null}
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}