import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getStatsCacheMetrics, invalidateStatsCache } from "@/lib/stats.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, Trash2, Zap, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/cache")({
  component: CachePage,
});

type Metrics = Awaited<ReturnType<typeof getStatsCacheMetrics>>;

function CachePage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchMetrics = useServerFn(getStatsCacheMetrics);
  const invalidate = useServerFn(invalidateStatsCache);

  const load = async () => {
    setLoading(true);
    try { setM(await fetchMetrics({})); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { label: "Hit rate", value: `${m?.hitRate ?? 0}%`, hint: `${m?.hits ?? 0} hits / ${m?.misses ?? 0} misses` },
    { label: "Last query", value: `${m?.lastQueryMs ?? 0}ms`, hint: `slow > ${m?.slowThresholdMs ?? 0}ms` },
    { label: "Slow queries", value: m?.slowQueries ?? 0, hint: m?.lastSlowAt ? new Date(m.lastSlowAt).toLocaleTimeString() : "none" },
    { label: "Invalidations", value: m?.invalidations ?? 0, hint: `TTL ${(m?.ttlMs ?? 0) / 1000}s` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Database}
        title="Stats Cache Monitor"
        description="Hit/miss ratio, TTL remaining per key, and slow query indicators."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={async () => { await invalidate({}); load(); }}>
              <Trash2 className="mr-2 h-4 w-4" />Clear cache
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60" style={{ background: "var(--gradient-card)" }}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{s.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle className="text-base">Cache entries</CardTitle></CardHeader>
        <CardContent>
          {(m?.entries.length ?? 0) === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Cache is empty.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="pb-2 font-medium">Key (days:client)</th>
                    <th className="pb-2 font-medium">Rows</th>
                    <th className="pb-2 font-medium">TTL remaining</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {m!.entries.map((e) => {
                    const sec = Math.round(e.ttlMs / 1000);
                    const cold = sec < 10;
                    return (
                      <tr key={e.key} className="border-b border-border/30">
                        <td className="py-2 font-mono text-xs">{e.key}</td>
                        <td className="py-2 text-xs">{e.total}</td>
                        <td className="py-2 text-xs">{sec}s</td>
                        <td className="py-2">
                          {cold ? (
                            <Badge variant="outline" className="text-warning"><AlertTriangle className="mr-1 h-3 w-3" />expiring</Badge>
                          ) : (
                            <Badge variant="secondary"><Zap className="mr-1 h-3 w-3" />warm</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}