import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { claimAdminIfNone } from "@/server/admin.functions";
import { AppShell } from "@/components/AppShell";
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
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundImage: "var(--gradient-mesh)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          />
          <div className="text-sm text-muted-foreground">Loading admin panel…</div>
        </div>
      </div>
    );
  }

  return (
    <AppShell mode="admin">
      <Outlet />
    </AppShell>
  );
}