import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/stats")({
  component: StatsPage,
});

type Row = {
  created_at: string; client_id: string | null; category: string | null;
  game: string | null; status_code: number | null; success: boolean;
  endpoint: string | null;
};
type Client = { id: string; name: string };

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

function StatsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");
  const [clientId, setClientId] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(days) * 86400_000).toISOString();
    let q = supabase.from("request_logs")
      .select("created_at, client_id, category, game, status_code, success, endpoint")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (clientId !== "all") q = q.eq("client_id", clientId);
    const { data } = await q;
    setRows((data as Row[] | null) ?? []);
    setLoading(false);
  }, [days, clientId]);

  useEffect(() => {
    supabase.from("api_clients").select("id, name").order("name")
      .then(({ data }) => setClients((data as Client[] | null) ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const byDay = useMemo(() => {
    const m = new Map<string, { date: string; success: number; failed: number }>();
    const n = Number(days);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      m.set(d, { date: d.slice(5), success: 0, failed: 0 });
    }
    rows.forEach((r) => {
      const k = r.created_at.slice(0, 10);
      const v = m.get(k);
      if (v) { if (r.success) v.success++; else v.failed++; }
    });
    return Array.from(m.values());
  }, [rows, days]);

  const byEndpoint = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      const k = r.endpoint || `${r.category}/${r.game}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return Array.from(m, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [rows]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => { const k = r.category || "unknown"; m.set(k, (m.get(k) ?? 0) + 1); });
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [rows]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      const c = r.status_code ?? 0;
      const k = c === 0 ? "n/a" : `${Math.floor(c / 100)}xx`;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return Array.from(m, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const total = rows.length;
  const successCount = rows.filter((r) => r.success).length;
  const successRate = total ? Math.round((successCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Usage Statistics"
        description="Visualize traffic by day, endpoint, category, and status."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Range</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24h</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total requests</div>
            <div className="mt-1 text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Success rate</div>
            <div className="mt-1 text-2xl font-bold text-success">{successRate}%</div>
          </CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Failed</div>
            <div className="mt-1 text-2xl font-bold text-destructive">{total - successCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle className="text-base">Requests by day</CardTitle></CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardHeader><CardTitle className="text-base">Top endpoints</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byEndpoint} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardHeader><CardTitle className="text-base">By category</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle className="text-base">By status code</CardTitle></CardHeader>
        <CardContent style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}