import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { ScrollText, Search, RefreshCw, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/admin/logs")({
  component: LogsPage,
});

type Row = {
  id: string; created_at: string; ip_address: string | null; api_key: string | null;
  category: string | null; game: string | null; type: string | null;
  status_code: number | null; success: boolean; error_message: string | null;
  response_time_ms: number | null; client_id: string | null; endpoint: string | null;
  host: string | null;
};

type Client = { id: string; name: string };

const CATEGORIES = ["wingo", "k3", "d5", "motorace"];
const TYPES = ["period", "history"];

function LogsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [clientId, setClientId] = useState("all");
  const [category, setCategory] = useState("all");
  const [game, setGame] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("request_logs")
      .select("id, created_at, ip_address, api_key, category, game, type, status_code, success, error_message, response_time_ms, client_id, endpoint, host")
      .order("created_at", { ascending: false }).limit(1000);
    if (clientId !== "all") q = q.eq("client_id", clientId);
    if (category !== "all") q = q.eq("category", category);
    if (game) q = q.eq("game", game);
    if (type !== "all") q = q.eq("type", type);
    if (status) q = q.eq("status_code", Number(status));
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) q = q.lte("created_at", new Date(to).toISOString());
    const { data } = await q;
    setRows((data as Row[] | null) ?? []);
    setLoading(false);
  }, [clientId, category, game, type, status, from, to]);

  useEffect(() => {
    supabase.from("api_clients").select("id, name").order("name").then(({ data }) => setClients((data as Client[] | null) ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!text) return rows;
    const q = text.toLowerCase();
    return rows.filter((r) =>
      [r.ip_address, r.api_key, r.endpoint, r.error_message, r.host].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [rows, text]);

  const successCount = filtered.filter((r) => r.success).length;
  const failCount = filtered.length - successCount;
  const avgMs = filtered.length
    ? Math.round(filtered.reduce((a, r) => a + (r.response_time_ms ?? 0), 0) / filtered.length)
    : 0;

  const reset = () => {
    setText(""); setClientId("all"); setCategory("all"); setGame("");
    setType("all"); setStatus(""); setFrom(""); setTo("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScrollText}
        title="Request Logs"
        description="Search and filter recent proxy traffic."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground">Successful</div><div className="mt-1 text-2xl font-bold text-success">{successCount}</div></CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground">Failed</div><div className="mt-1 text-2xl font-bold text-destructive">{failCount}</div></CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground">Avg latency</div><div className="mt-1 text-2xl font-bold">{avgMs} <span className="text-sm font-normal text-muted-foreground">ms</span></div></CardContent>
        </Card>
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={reset}><X className="mr-1 h-3 w-3" />Reset</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Game</Label>
              <Input placeholder="e.g. 1m, 30s" value={game} onChange={(e) => setGame(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status code</Label>
              <Input placeholder="e.g. 200, 403" value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Search (IP, key, endpoint, error)</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search…" className="pl-10" value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/40">
                <ScrollText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No logs found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-2 text-xs text-muted-foreground">{filtered.length} entries</div>
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">IP</th>
                    <th className="pb-3 font-medium">Key</th>
                    <th className="pb-3 font-medium">Host</th>
                    <th className="pb-3 font-medium">Endpoint</th>
                    <th className="pb-3 font-medium">Type</th>
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
                      <td className="font-mono text-xs text-muted-foreground">{r.host ?? "—"}</td>
                      <td><span className="rounded-md bg-secondary/40 px-2 py-0.5 font-mono text-xs">{r.category}/{r.game}</span></td>
                      <td><span className="rounded-md bg-secondary/30 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{r.type ?? "—"}</span></td>
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
