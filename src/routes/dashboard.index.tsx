import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/server/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, KeyRound, Receipt, LayoutDashboard, Plus, ArrowUpRight, Coins } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: ResellerDashboard,
});

type Overview = Awaited<ReturnType<typeof getMyOverview>>;

function ResellerDashboard() {
  const fetchOverview = useServerFn(getMyOverview);
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => { fetchOverview().then(setData).catch(() => setData(null)); }, [fetchOverview]);

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
        <StatCard label="Transactions" value={txs.length} icon={Receipt} hint="last 20 shown" />
      </div>

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