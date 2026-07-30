import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useCachedData } from "@/lib/use-cached";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, KeyRound, ScrollText, CheckCircle2, LayoutDashboard, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isFetching } = useCachedData<{
    stats: { total: number; active: number; requests: number; today: number };
    recent: any[];
  }>("admin:overview", async () => {
    const [{ count: total }, { count: active }, { count: requests }, { count: today }, logs] = await Promise.all([
        supabase.from("api_clients").select("id", { count: "exact", head: true }),
        supabase.from("api_clients").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("request_logs").select("id", { count: "exact", head: true }),
        supabase.from("request_logs").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("request_logs").select("id, created_at, ip_address, category, game, status_code, success, error_message").order("created_at", { ascending: false }).limit(8),
    ]);
    return {
      stats: { total: total ?? 0, active: active ?? 0, requests: requests ?? 0, today: today ?? 0 },
      recent: logs.data ?? [],
    };
  });
  const stats = data?.stats ?? { total: 0, active: 0, requests: 0, today: 0 };
  const recent = data?.recent ?? [];
  const loading = !data && isFetching;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Real-time overview of your API proxy system."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/clients">
              Manage clients <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={loading ? "—" : stats.total} icon={Users} hint="across all accounts" />
        <StatCard label="Active keys" value={loading ? "—" : stats.active} icon={KeyRound} hint="ready to use" />
        <StatCard label="Requests (24h)" value={loading ? "—" : stats.today} icon={CheckCircle2} hint="in the last day" />
        <StatCard label="Total requests" value={loading ? "—" : stats.requests} icon={ScrollText} hint="all-time" />
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Last 8 proxy requests</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/logs">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/40">
                <ScrollText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No requests yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Activity will appear here once clients make API calls.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">IP Address</th>
                    <th className="pb-3 font-medium">Endpoint</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                      <td className="py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleTimeString()}</td>
                      <td className="font-mono text-xs">{r.ip_address}</td>
                      <td><span className="rounded-md bg-secondary/40 px-2 py-1 font-mono text-xs">{r.category}/{r.game}</span></td>
                      <td>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.success ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.success ? "bg-success" : "bg-destructive"}`} />
                          {r.status_code}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
