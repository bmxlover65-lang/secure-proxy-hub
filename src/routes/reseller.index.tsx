import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, KeyRound, Activity, ShieldCheck, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reseller/")({
  component: ResellerOverview,
});

function ResellerOverview() {
  const { user } = useAuth();
  const [reseller, setReseller] = useState<any>(null);
  const [ips, setIps] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, today: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: r } = await supabase.from("resellers").select("*").eq("user_id", user.id).maybeSingle();
      setReseller(r);
      if (r) {
        const { data: ipsData } = await supabase.from("allowed_ips").select("ip_address").eq("reseller_id", r.id);
        setIps((ipsData ?? []).map((x: any) => x.ip_address));
        const [{ count: total }, { count: success }, { count: today }] = await Promise.all([
          supabase.from("request_logs").select("id", { count: "exact", head: true }).eq("reseller_id", r.id),
          supabase.from("request_logs").select("id", { count: "exact", head: true }).eq("reseller_id", r.id).eq("success", true),
          supabase.from("request_logs").select("id", { count: "exact", head: true }).eq("reseller_id", r.id).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        ]);
        setStats({ total: total ?? 0, success: success ?? 0, today: today ?? 0 });
      }
    })();
  }, [user]);

  if (!reseller) {
    return (
      <Card className="border-border" style={{ background: "var(--gradient-card)" }}>
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-semibold">No reseller account assigned yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask your admin to create a reseller record linked to your account.
          </p>
        </CardContent>
      </Card>
    );
  }

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{reseller.name}</h1>
          <p className="text-sm text-muted-foreground">Your reseller overview.</p>
        </div>
        <Badge variant={reseller.status === "active" ? "default" : "destructive"}>{reseller.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Requests today" value={stats.today} icon={Activity} hint="last 24h" />
        <StatCard label="Successful" value={stats.success} icon={ShieldCheck} />
        <StatCard label="Total requests" value={stats.total} icon={KeyRound} />
      </div>

      <Card className="border-border" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle>Your API Key</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-3 font-mono text-sm">
            <span className="truncate">{reseller.api_key}</span>
            <Button size="sm" variant="ghost" onClick={() => copy(reseller.api_key)}><Copy className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Rate limit: <strong>{reseller.rate_limit_per_minute}</strong> requests / minute</p>
        </CardContent>
      </Card>

      <Card className="border-border" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle>Whitelisted IPs</CardTitle></CardHeader>
        <CardContent>
          {ips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No IPs configured — all IPs allowed (ask your admin to lock this down).</p>
          ) : (
            <ul className="space-y-1 font-mono text-sm">
              {ips.map((ip) => <li key={ip} className="rounded bg-background px-3 py-1.5">{ip}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline"><Link to="/reseller/docs"><BookOpen className="mr-2 h-4 w-4" />View API documentation</Link></Button>
    </div>
  );
}