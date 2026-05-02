import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminTestUpstream } from "@/server/admin.functions";
import { SUPPORTED_GAMES } from "@/server/upstream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Activity, Play, Loader2, Clock, Globe, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/health")({
  component: HealthPage,
});

function HealthPage() {
  const test = useServerFn(adminTestUpstream);
  const [category, setCategory] = useState("wingo");
  const [game, setGame] = useState("30s");
  const [result, setResult] = useState<{ ok: boolean; status: number; ms: number; url: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const games = SUPPORTED_GAMES.find((c) => c.category === category)?.games ?? [];

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await test({ data: { category, game } });
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

  const rawBody = typeof result?.body === "string" ? result.body : "";
  let pretty = rawBody;
  try { pretty = JSON.stringify(JSON.parse(rawBody), null, 2); } catch { /* keep raw */ }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="API Health"
        description="Test the live upstream feed for any supported game."
      />

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle>Test endpoint</CardTitle>
          <CardDescription>Pick a category and game, then run a live request to the upstream API.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
