import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/logs")({
  component: LogsPage,
});

function LogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("request_logs")
        .select("id, created_at, ip_address, api_key, category, game, status_code, success, error_message, response_time_ms, reseller_id")
        .order("created_at", { ascending: false })
        .limit(500);
      setRows(data ?? []);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return [r.ip_address, r.api_key, r.category, r.game, r.error_message].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Request Logs</h1>
          <p className="text-sm text-muted-foreground">Last 500 proxy requests.</p>
        </div>
        <Input placeholder="Filter IP, key, game, error…" className="max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <Card style={{ background: "var(--gradient-card)" }} className="border-border">
        <CardHeader><CardTitle>{filtered.length} entries</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Time</th><th>IP</th><th>Key</th><th>Endpoint</th><th>Status</th><th>ms</th><th>Error</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="font-mono text-xs">{r.ip_address}</td>
                    <td className="font-mono text-xs">{r.api_key ? r.api_key.slice(0, 12) + "…" : "-"}</td>
                    <td className="text-xs">{r.category}/{r.game}</td>
                    <td>
                      <span className={`rounded px-2 py-0.5 text-xs ${r.success ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                        {r.status_code}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">{r.response_time_ms ?? "-"}</td>
                    <td className="max-w-xs truncate text-xs text-muted-foreground" title={r.error_message ?? ""}>{r.error_message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}