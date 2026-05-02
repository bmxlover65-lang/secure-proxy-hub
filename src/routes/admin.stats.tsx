import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getStats, invalidateStatsCache } from "@/server/stats.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Loader2, RefreshCw, Radio } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/stats")({
  component: StatsPage,
});

type Aggregated = Awaited<ReturnType<typeof getStats>>;
type Client = { id: string; name: string };

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

// Module-level client cache so navigating away and back is instant.
const clientCache = new Map<string, { data: Aggregated; expires: number }>();
const CLIENT_TTL_MS = 60_000;

function StatsPage() {
  const [stats, setStats] = useState<Aggregated | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState("7");
  const [clientId, setClientId] = useState("all");
  const [live, setLive] = useState(true);
  const fetchStats = useServerFn(getStats);
  const invalidate = useServerFn(invalidateStatsCache);
  const reqId = useRef(0);

  const load = useCallback(async (force = false) => {
    const key = `${days}:${clientId}`;
    const now = Date.now();
    const cached = clientCache.get(key);
    if (!force && cached && cached.expires > now) {
      setStats(cached.data);
      setLoading(false);
      return;
    }
    if (cached) setStats(cached.data); // show stale instantly
    setLoading(true);
    const myReq = ++reqId.current;
    try {
      if (force) {
        try { await invalidate({}); } catch { /* ignore */ }
        clientCache.delete(key);
      }
      const data = await fetchStats({
        data: { days: Number(days), clientId: clientId === "all" ? null : clientId },
      });
      if (myReq !== reqId.current) return;
      clientCache.set(key, { data, expires: now + CLIENT_TTL_MS });
      setStats(data);
    } finally {
      if (myReq === reqId.current) setLoading(false);
    }
  }, [days, clientId, fetchStats, invalidate]);

  useEffect(() => {
    supabase.from("api_clients").select("id, name").order("name")
      .then(({ data }) => setClients((data as Client[] | null) ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Realtime: invalidate on new logs (debounced) + auto-refresh fallback.
  useEffect(() => {
    if (!live) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; load(true); }, 1500);
    };
    const channel = supabase
      .channel("stats-logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "request_logs" }, trigger)
      .subscribe();
    const interval = setInterval(() => load(true), 15_000);
    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [live, load]);

  const total = stats?.total ?? 0;
  const successCount = stats?.success ?? 0;
  const successRate = total ? Math.round((successCount / total) * 100) : 0;
  const byDay = stats?.byDay ?? [];
  const byEndpoint = stats?.byEndpoint ?? [];
  const byCategory = stats?.byCategory ?? [];
  const byStatus = stats?.byStatus ?? [];
  const showSkeleton = loading && !stats;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Usage Statistics"
        description="Visualize traffic by day, endpoint, category, and status."
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className={`h-3.5 w-3.5 ${live ? "text-success" : ""}`} />
              Live
              <Switch checked={live} onCheckedChange={setLive} />
            </label>
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
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
        {[
          { label: "Total requests", value: total, cls: "" },
          { label: "Success rate", value: `${successRate}%`, cls: "text-success" },
          { label: "Failed", value: total - successCount, cls: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60" style={{ background: "var(--gradient-card)" }}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              {showSkeleton
                ? <Skeleton className="mt-1 h-8 w-20" />
                : <div className={`mt-1 text-2xl font-bold ${s.cls}`}>{s.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle className="text-base">Requests by day</CardTitle></CardHeader>
        <CardContent style={{ height: 300 }}>
          {showSkeleton ? <Skeleton className="h-full w-full" /> : (
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
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardHeader><CardTitle className="text-base">Top endpoints</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            {showSkeleton ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byEndpoint} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardHeader><CardTitle className="text-base">By category</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            {showSkeleton ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle className="text-base">By status code</CardTitle></CardHeader>
        <CardContent style={{ height: 280 }}>
          {showSkeleton ? <Skeleton className="h-full w-full" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}