import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  head: () => ({ meta: [{ title: "Dashboard — Hyper Softs SaaS" }] }),
});

function DashboardLayout() {
  const { session, loading, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    if (isAdmin) { navigate({ to: "/admin" }); return; }
  }, [loading, session, isAdmin, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).maybeSingle();
      if (active) setBalance(Number(data?.wallet_balance ?? 0));
    };
    load();
    const channel = supabase
      .channel(`wallet:${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        const newBal = (payload.new as { wallet_balance?: number }).wallet_balance;
        if (newBal !== undefined) setBalance(Number(newBal));
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  if (loading || !session || isAdmin) {
    return (
      <div className="min-h-screen p-8">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <AppShell mode="reseller" walletBalance={balance}>
      <Outlet />
    </AppShell>
  );
}