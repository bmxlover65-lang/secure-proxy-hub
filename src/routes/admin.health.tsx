import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminTestUpstream } from "@/server/admin.functions";
import { SUPPORTED_GAMES } from "@/server/upstream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Activity } from "lucide-react";

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
      setResult(r);
      if (!r.ok) toast.error(`Status ${r.status}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  let pretty = result?.body ?? "";
  try { pretty = JSON.stringify(JSON.parse(result?.body ?? ""), null, 2); } catch { /* keep raw */ }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">API Health</h1>
        <p className="text-sm text-muted-foreground">Test the live upstream feed for any game.</p>
      </div>
      <Card style={{ background: "var(--gradient-card)" }} className="border-border">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" />Test endpoint</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Category</div>
              <Select value={category} onValueChange={(v) => { setCategory(v); const gs = SUPPORTED_GAMES.find((c) => c.category === v)?.games ?? []; setGame(gs[0] ?? ""); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_GAMES.map((c) => <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Game</div>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {games.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={run} disabled={loading}>{loading ? "Fetching…" : "Run test"}</Button>
          </div>

          {result && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`rounded px-2 py-0.5 ${result.ok ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>HTTP {result.status}</span>
                <span className="text-muted-foreground">{result.ms} ms</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{result.url}</span>
              </div>
              <pre className="max-h-[500px] overflow-auto rounded-md border border-border bg-background p-4 font-mono text-xs">
                {pretty}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}