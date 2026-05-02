import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { claimAdminIfNone } from "@/server/admin.functions";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { session, loading, isAdmin, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const claim = useServerFn(claimAdminIfNone);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (!isAdmin) {
      // Try bootstrap claim — only works if no admin exists yet
      claim()
        .then(async (r) => {
          if (r.claimed) {
            await refreshRoles();
            toast.success("Admin access granted (bootstrap)");
          } else {
            toast.error("Not an admin account");
            navigate({ to: "/login" });
          }
        })
        .catch(() => navigate({ to: "/login" }));
    }
  }, [loading, session, isAdmin, navigate, claim, refreshRoles]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="min-h-screen text-foreground" style={{ backgroundImage: "var(--gradient-mesh)" }}>
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col gap-3 border-r border-border/60 bg-card/80 p-4 backdrop-blur md:flex">
          <Skeleton className="h-10 w-40" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <div className="mt-auto"><Skeleton className="h-12 w-full" /></div>
        </aside>
        <main className="md:pl-72">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur md:px-8">
            <Skeleton className="h-5 w-40" />
          </header>
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 md:px-8">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <AppShell mode="admin">
      <Outlet />
    </AppShell>
  );
}