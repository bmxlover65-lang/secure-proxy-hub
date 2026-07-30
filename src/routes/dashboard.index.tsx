import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview, getMyKeyMetrics } from "@/lib/reseller.functions";
import { useCachedData } from "@/lib/use-cached";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, KeyRound, Receipt, LayoutDashboard, Plus, ArrowUpRight, Coins, Activity, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: ResellerDashboard,
});

type Overview = Awaited<ReturnType<typeof getMyOverview>>;
type Metrics = Awaited<ReturnType<typeof getMyKeyMetrics>>;

function ResellerDashboard() {
  const fetchOverview = useServerFn(getMyOverview);
  const fetchMetrics = useServerFn(getMyKeyMetrics);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const { data } = useCachedData<Overview>("reseller:overview", () => fetchOverview());

  const metricsKey = `reseller:metrics:${from}:${to}`;
  const loadMetricsFn = useCallback(() => {
    const payload: { from?: string; to?: string } = {};
    if (from) payload.from = new Date(from).toISOString();
    if (to) payload.to = new Date(to).toISOString();
    return fetchMetrics({ data: payload });
  }, [fetchMetrics, from, to]);
  const { data: metrics, refetch: loadMetrics } = useCachedData<Metrics>(metricsKey, loadMetricsFn);

  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const cost = Number(data?.settings.coins_per_api_key ?? 1000);
  const keys = data?.clients ?? [];
  const txs = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome back${data?.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""} 👋`}
        description="Manage your API keys, wallet and request activity."
        actions={
          <Button asChild>
            <Link to="/dashboard/keys"><Plus className="mr-1.5 h-4 w-4" /> New API Key</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wallet balance" value={balance.toLocaleString()} icon={Coins} hint="coins available" />
        <StatCard label="Cost per key" value={cost.toLocaleString()} icon={Wallet} hint="coins per API key" />
        <StatCard label="Active keys" value={keys.filter(k => k.status === "active").length} icon={KeyRound} hint={`${keys.length} total`} />
        <StatCard label="Total requests" value={(metrics?.total_requests ?? 0).toLocaleString()} icon={Activity} hint={`${metrics?.success_count ?? 0} success • ${metrics?.error_count ?? 0} errors`} />
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>API key usage</CardTitle>
            <CardDescription>Requests per key with last activity</CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div><Label className="text-[11px]">From</Label><Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-[180px]" /></div>
            <div><Label className="text-[11px]">To</Label><Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-[180px]" /></div>
            <Button size="sm" variant="outline" onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>
            <Button size="sm" onClick={loadMetrics}><RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!metrics || metrics.metrics.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No usage data in this range.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/40"><th className="p-3">Key</th><th>Category</th><th>Requests</th><th>Success</th><th>Errors</th><th>Last request</th></tr>
              </thead>
              <tbody>
                {metrics.metrics.map((m) => (
                  <tr key={m.id} className="border-b border-border/30">
                    <td className="p-3"><div className="font-medium">{m.name}</div><div className="font-mono text-[11px] text-muted-foreground">{m.api_key.slice(0, 18)}…</div></td>
                    <td className="font-mono uppercase text-xs">{m.category}</td>
                    <td className="font-mono">{m.total_requests.toLocaleString()}</td>
                    <td className="text-success font-mono">{m.success_count.toLocaleString()}</td>
                    <td className="text-destructive font-mono">{m.error_count.toLocaleString()}</td>
                    <td className="text-xs text-muted-foreground">{m.last_request_at ? new Date(m.last_request_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your API keys</CardTitle>
              <CardDescription>Latest keys you created</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/keys">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No keys yet. Create your first API key to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {keys.slice(0, 5).map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3">
                    <div>
                      <div className="font-medium text-sm">{k.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{k.api_key.slice(0, 20)}…</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${k.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{k.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Coin activity</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/transactions">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
            ) : (
              <div className="space-y-2">
                {txs.slice(0, 5).map((t) => {
                  const amt = Number(t.amount);
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3 text-sm">
                      <div>
                        <div className="font-medium">{t.reason ?? t.type}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                      </div>
                      <span className={`font-mono font-semibold ${amt >= 0 ? "text-success" : "text-destructive"}`}>
                        {amt >= 0 ? "+" : ""}{amt.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}