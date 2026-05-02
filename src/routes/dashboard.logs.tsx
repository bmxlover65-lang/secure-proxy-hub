import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { resellerListLogs } from "@/server/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/dashboard/logs")({ component: LogsPage });

function LogsPage() {
  const fetchLogs = useServerFn(resellerListLogs);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof resellerListLogs>>["logs"]>([]);
  useEffect(() => { fetchLogs().then((r) => setLogs(r.logs)).catch(() => {}); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <PageHeader icon={ScrollText} title="Request Logs" description="API requests made with your keys (last 200)." />
      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/40"><th className="p-3">Time</th><th>Endpoint</th><th>Status</th><th>Latency</th><th>IP</th><th>Host</th></tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-border/30">
                      <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="font-mono text-xs">{l.category}/{l.game}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${l.success ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {l.status_code ?? "—"}
                        </span>
                      </td>
                      <td className="text-xs">{l.response_time_ms ?? "—"} ms</td>
                      <td className="font-mono text-xs">{l.ip_address ?? "—"}</td>
                      <td className="font-mono text-xs">{l.host ?? "—"}</td>
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