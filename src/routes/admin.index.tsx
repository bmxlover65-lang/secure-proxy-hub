import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, KeyRound, ScrollText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, requests: 0, today: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: total }, { count: active }, { count: requests }, { count: today }, logs] = await Promise.all([
        supabase.from("resellers").select("id", { count: "exact", head: true }),
        supabase.from("resellers").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("request_logs").select("id", { count: "exact", head: true }),
        supabase.from("request_logs").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("request_logs").select("id, created_at, ip_address, category, game, status_code, success, error_message").order("created_at", { ascending: false }).limit(8),
      ]);
      setStats({ total: total ?? 0, active: active ?? 0, requests: requests ?? 0, today: today ?? 0 });
      setRecent(logs.data ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your reseller proxy system.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total resellers" value={stats.total} icon={Users} />
        <StatCard label="Active keys" value={stats.active} icon={KeyRound} />
        <StatCard label="Requests today" value={stats.today} icon={CheckCircle2} hint="last 24h" />
        <StatCard label="Total requests" value={stats.requests} icon={ScrollText} />
      </div>
      <Card style={{ background: "var(--gradient-card)" }} className="border-border">
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Time</th><th>IP</th><th>Endpoint</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-2">{new Date(r.created_at).toLocaleTimeString()}</td>
                      <td className="font-mono text-xs">{r.ip_address}</td>
                      <td>{r.category}/{r.game}</td>
                      <td>
                        <span className={`rounded px-2 py-0.5 text-xs ${r.success ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
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