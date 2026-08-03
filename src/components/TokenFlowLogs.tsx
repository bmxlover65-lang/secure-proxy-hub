import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCachedData } from "@/lib/use-cached";
import { listTokenFlowLogs } from "@/lib/callback.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";

const FLOWS = ["all", "TokenIssue", "TokenEnter", "TokenValidate"] as const;
const STATUS = ["all", "allowed", "blocked"] as const;

function toIso(v: string, end = false): string | undefined {
  if (!v) return undefined;
  const d = new Date(end ? `${v}T23:59:59` : `${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function TokenFlowLogs() {
  const fetchLogs = useServerFn(listTokenFlowLogs);
  const [flow, setFlow] = useState<(typeof FLOWS)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("all");
  const [user, setUser] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const key = `token-flow:${flow}:${status}:${user}:${from}:${to}`;
  const { data, isFetching, refetch } = useCachedData(key, () =>
    fetchLogs({
      data: {
        limit: 150, flow, status,
        ...(user.trim() ? { external_user_id: user.trim() } : {}),
        ...(toIso(from) ? { from: toIso(from) } : {}),
        ...(toIso(to, true) ? { to: toIso(to, true) } : {}),
      },
    }),
  );
  const logs = data?.logs ?? [];
  const blocked = logs.filter((l) => !l.allowed).length;

  return (
    <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="font-display flex items-center gap-2 text-base uppercase tracking-tight">
          <ShieldCheck className="h-4 w-4 text-primary" /> Token enter / consume log
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Flow</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {FLOWS.map((f) => (
                <Button key={f} size="sm" variant={flow === f ? "default" : "outline"} onClick={() => setFlow(f)}
                  className="h-7 px-2 font-mono text-[11px]">{f === "all" ? "ALL" : f.replace("Token", "")}</Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Result</Label>
            <div className="mt-1 flex gap-1">
              {STATUS.map((s) => (
                <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}
                  className="h-7 px-2 font-mono text-[11px] uppercase">{s}</Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">user_id</Label>
            <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="12345" className="mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-y border-border/40 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>rows: <span className="text-foreground">{logs.length}</span></span>
          <span>blocked: <span className="text-destructive">{blocked}</span></span>
          <span>allowed: <span className="text-primary">{logs.length - blocked}</span></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/40">
                <th className="p-2">Time</th><th>Flow</th><th>user_id</th><th>token_hash</th>
                <th>Result</th><th>Reason</th><th>Sig</th><th>Host / IP</th><th>ms</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/20">
                  <td className="whitespace-nowrap p-2 font-mono text-[11px]">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="font-mono text-[11px]">{l.flow}</td>
                  <td className="font-mono text-[11px]">{l.external_user_id ?? "—"}</td>
                  <td className="font-mono text-[11px] text-muted-foreground">{l.token_hash ?? "—"}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${l.allowed ? "text-primary" : "text-destructive"}`}>
                      {l.allowed ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                      {l.allowed ? "ALLOWED" : "BLOCKED"} {l.status_code}
                    </span>
                  </td>
                  <td className="max-w-[280px] text-[11px] text-muted-foreground">{l.reason}</td>
                  <td className="font-mono text-[11px]">{l.signature_status ?? "—"}</td>
                  <td className="font-mono text-[11px] text-muted-foreground">{l.host ?? "—"} / {l.ip_address ?? "—"}</td>
                  <td className="font-mono text-[11px]">{l.response_time_ms ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">No token activity for these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
