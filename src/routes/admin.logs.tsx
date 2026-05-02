import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { ScrollText, Search, RefreshCw, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/logs")({
  component: LogsPage,
});

function LogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("request_logs")
      .select("id, created_at, ip_address, api_key, category, game, status_code, success, error_message, response_time_ms, client_id")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return [r.ip_address, r.api_key, r.category, r.game, r.error_message].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const successCount = filtered.filter((r) => r.success).length;
  const failCount = filtered.length - successCount;
  const avgMs = filtered.length
    ? Math.round(filtered.reduce((a, r) => a + (r.response_time_ms ?? 0), 0) / filtered.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScrollText}
        title="Request Logs"
        description="Last 500 proxy requests across all clients."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Successful</div>
            <div className="mt-1 text-2xl font-bold text-success">{successCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Failed</div>
            <div className="mt-1 text-2xl font-bold text-destructive">{failCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Avg latency</div>
            <div className="mt-1 text-2xl font-bold">{avgMs} <span className="text-sm font-normal text-muted-foreground">ms</span></div>
          </CardContent>
        </Card>
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>{filtered.length} entries</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Filter IP, key, game, error…" className="pl-10" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/40">
                <ScrollText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No logs found</p>
              <p className="mt-1 text-xs text-muted-foreground">{filter ? "Try a different filter." : "Requests will appear here."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">IP</th>
                    <th className="pb-3 font-medium">Key</th>
                    <th className="pb-3 font-medium">Endpoint</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Latency</th>
                    <th className="pb-3 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                      <td className="py-2.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="font-mono text-xs">{r.ip_address}</td>
                      <td className="font-mono text-xs text-muted-foreground">{r.api_key ? r.api_key.slice(0, 12) + "…" : "—"}</td>
                      <td><span className="rounded-md bg-secondary/40 px-2 py-0.5 font-mono text-xs">{r.category}/{r.game}</span></td>
                      <td>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.success ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.success ? "bg-success" : "bg-destructive"}`} />
                          {r.status_code}
                        </span>
                      </td>
                      <td className="text-xs tabular-nums text-muted-foreground">{r.response_time_ms ?? "—"} ms</td>
                      <td className="max-w-xs truncate text-xs text-muted-foreground" title={r.error_message ?? ""}>{r.error_message ?? "—"}</td>
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
