import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminTestUpstream, adminTestAllUpstreams } from "@/lib/admin.functions";
import { SUPPORTED_GAMES } from "@/lib/games";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Activity, Play, Loader2, Clock, Globe, CheckCircle2, XCircle, RefreshCw, Zap } from "lucide-react";

export const Route = createFileRoute("/admin/health")({
  component: HealthPage,
});

function HealthPage() {
  const test = useServerFn(adminTestUpstream);
  const testAll = useServerFn(adminTestAllUpstreams);
  const { loading: authLoading } = useAuth();
  const [category, setCategory] = useState("wingo");
  const [game, setGame] = useState("30s");
  const [type, setType] = useState<"period" | "history">("period");
  const [result, setResult] = useState<{ ok: boolean; status: number; ms: number; url: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  type AllRow = { category: string; game: string; type: "period" | "history"; url: string; ok: boolean; status: number; ms: number; error?: string };
  const [allRows, setAllRows] = useState<AllRow[] | null>(null);
  const [allLoading, setAllLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const games = SUPPORTED_GAMES.find((c) => c.category === category)?.games ?? [];

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await test({ data: { category, game, type } });
      // Defensive: ensure r matches the expected shape (string body)
      if (r && typeof r === "object" && "body" in r && typeof (r as any).body === "string") {
        setResult(r);
        if (!r.ok) toast.error(`Upstream status ${r.status}`);
        else toast.success(`OK in ${r.ms}ms`);
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (e) {
      // Server fn may throw a Response (e.g. 401 from auth middleware)
      let msg = "Request failed";
      if (e instanceof Response) {
        try { msg = await e.text(); } catch { /* ignore */ }
        msg = `HTTP ${e.status}${msg ? `: ${msg.slice(0, 200)}` : ""}`;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const runAll = async () => {
    setAllLoading(true);
    try {
      const r = await testAll({ data: {} as any });
      if (r && Array.isArray((r as any).results)) {
        setAllRows((r as any).results as AllRow[]);
        setCheckedAt((r as any).checkedAt ?? new Date().toISOString());
        const okCount = (r as any).results.filter((x: AllRow) => x.ok).length;
        const total = (r as any).results.length;
        if (okCount === total) toast.success(`All ${total} endpoints healthy`);
        else toast.warning(`${okCount}/${total} endpoints healthy`);
      }
    } catch (e) {
      let msg = "Request failed";
      if (e instanceof Response) {
        try { msg = `HTTP ${e.status}: ${(await e.text()).slice(0, 200)}`; } catch { msg = `HTTP ${e.status}`; }
      } else if (e instanceof Error) msg = e.message;
      toast.error(msg);
    } finally {
      setAllLoading(false);
    }
  };

  // Auto-run once auth session is hydrated (avoids 401 race on mount)
  const [autoRan, setAutoRan] = useState(false);
  useEffect(() => {
    if (authLoading || autoRan) return;
    setAutoRan(true);
    runAll().catch(() => {});
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [authLoading]);

  const rawBody = typeof result?.body === "string" ? result.body : "";
  let pretty = rawBody;
  try { pretty = JSON.stringify(JSON.parse(rawBody), null, 2); } catch { /* keep raw */ }

  const okCount = allRows?.filter((r) => r.ok).length ?? 0;
  const totalCount = allRows?.length ?? 0;
  const avgMs = allRows && allRows.length > 0
    ? Math.round(allRows.reduce((s, r) => s + (r.ms || 0), 0) / allRows.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="API Health"
        description="Live status of every supported upstream game endpoint."
      />

      {/* All-endpoints overview */}
      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> All endpoints</CardTitle>
            <CardDescription>
              {checkedAt
                ? <>Last checked {new Date(checkedAt).toLocaleTimeString()}{totalCount > 0 ? ` · ${okCount}/${totalCount} healthy · avg ${avgMs}ms` : ""}</>
                : "Run a check to see live status of every supported game."}
            </CardDescription>
          </div>
          <Button onClick={runAll} disabled={allLoading} variant="outline" size="sm">
            {allLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</>
              : <><RefreshCw className="mr-2 h-4 w-4" /> Test all</>}
          </Button>
        </CardHeader>
        <CardContent>
          {allLoading && !allRows && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Pinging upstream endpoints…
            </div>
          )}
          {allRows && allRows.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Category</th>
                    <th className="px-3 py-2 text-left font-medium">Game</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Latency</th>
                    <th className="px-3 py-2 text-left font-medium">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {allRows.map((r) => (
                  <tr key={`${r.category}-${r.game}-${r.type}`} className="border-t border-border/60 hover:bg-secondary/20">
                      <td className="px-3 py-2 font-medium uppercase">{r.category}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.game}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">{r.type}</Badge>
                    </td>
                      <td className="px-3 py-2">
                        {r.ok ? (
                          <Badge className="border-success/30 bg-success/10 text-success hover:bg-success/15">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> {r.status} OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/20">
                            <XCircle className="mr-1 h-3 w-3" /> {r.status || "ERR"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {r.ms > 0 ? `${r.ms}ms` : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        <span className="block max-w-[420px] truncate">{r.url}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle>Inspect single endpoint</CardTitle>
          <CardDescription>Pick a category and game, then run a live request to view the full JSON payload.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</div>
              <Select value={category} onValueChange={(v) => { setCategory(v); const gs = SUPPORTED_GAMES.find((c) => c.category === v)?.games ?? []; setGame(gs[0] ?? ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_GAMES.map((c) => <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Game</div>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {games.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</div>
              <Select value={type} onValueChange={(v) => setType(v as "period" | "history")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="period">period (current)</SelectItem>
                  <SelectItem value="history">history</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={run}
                disabled={loading}
                className="w-full sm:w-auto"
                style={{ background: "var(--gradient-primary)" }}
              >
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing…</>
                  : <><Play className="mr-2 h-4 w-4" /> Run test</>
                }
              </Button>
            </div>
          </div>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                  result.ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"
                }`}>
                  {result.ok
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : <XCircle className="h-5 w-5 text-destructive" />}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Status</div>
                    <div className={`text-lg font-bold ${result.ok ? "text-success" : "text-destructive"}`}>HTTP {result.status}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Latency</div>
                    <div className="text-lg font-bold">{result.ms} <span className="text-sm font-normal text-muted-foreground">ms</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Endpoint</div>
                    <div className="truncate font-mono text-xs">{result.url}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Response</div>
                <pre className="max-h-[500px] overflow-auto rounded-xl border border-border/60 bg-background/60 p-4 font-mono text-xs leading-relaxed">
                  {pretty}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
