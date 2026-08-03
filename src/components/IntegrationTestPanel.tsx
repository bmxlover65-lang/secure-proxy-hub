import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCachedData, invalidateCache } from "@/lib/use-cached";
import { runIntegrationTest, listIntegrationTests } from "@/lib/callback.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, Play, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

const OPS = ["GetBalance", "PlaceBet", "WinLoss"] as const;
type Op = (typeof OPS)[number];

export type TestClient = {
  id: string;
  name: string;
  mode: string;
  callback_enabled: boolean;
  callback_url: string | null;
  callback_secret: string | null;
};

type Result = { ok: boolean; status: number; message: string; at: string; response: unknown };

export function IntegrationTestPanel({ clients, scope }: { clients: TestClient[]; scope: string }) {
  const runTest = useServerFn(runIntegrationTest);
  const fetchTests = useServerFn(listIntegrationTests);

  const cacheKey = `${scope}:cb:tests`;
  const { data: history, refetch } = useCachedData<Awaited<ReturnType<typeof listIntegrationTests>>>(
    cacheKey, () => fetchTests(), { staleTime: 15_000 },
  );

  const cbClients = clients.filter((c) => c.mode === "callback");
  const [clientId, setClientId] = useState<string>(cbClients[0]?.id ?? "");
  const [userId, setUserId] = useState("test-user");
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState<Op | "all" | null>(null);

  const selected = cbClients.find((c) => c.id === clientId);

  const lastFor = (op: Op): Result | null => {
    const live = results[`${clientId}|${op}`];
    if (live) return live;
    const row = (history?.tests ?? []).find(
      (t) => t.client_id === clientId && t.callback_type === `Test:${op}`,
    );
    if (!row) return null;
    return {
      ok: row.success,
      status: row.status_code ?? 0,
      message: row.error_message ?? "ok",
      at: row.created_at,
      response: null,
    };
  };

  const run = async (op: Op) => {
    if (!clientId) { toast.error("Select a callback key first"); return; }
    setBusy(op);
    try {
      const res = await runTest({ data: { client_id: clientId, callback_type: op, user_id: userId.trim() || "test-user" } });
      setResults((s) => ({ ...s, [`${clientId}|${op}`]: res }));
      invalidateCache(cacheKey);
      void refetch();
      if (res.ok) toast.success(`${op} dry-run passed (${res.status})`);
      else toast.error(`${op} failed: ${res.message}`);
      return res.ok;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
      return false;
    } finally { setBusy(null); }
  };

  const runAll = async () => {
    setBusy("all");
    try {
      for (const op of OPS) {
        const res = await runTest({ data: { client_id: clientId, callback_type: op, user_id: userId.trim() || "test-user" } });
        setResults((s) => ({ ...s, [`${clientId}|${op}`]: res }));
      }
      invalidateCache(cacheKey);
      void refetch();
      toast.success("Dry-run suite finished");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally { setBusy(null); }
  };

  return (
    <Card style={{ background: "var(--gradient-card)" }} className="border-border">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide">
            <FlaskConical className="h-4 w-4 text-primary" /> Integration Test (dry-run)
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="label-mono text-[10px]">Callback key</Label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="block h-[34px] max-w-[280px] border border-border bg-background px-2 font-mono text-xs"
            >
              {cbClients.length === 0 && <option value="">no callback-mode keys</option>}
              {cbClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="label-mono text-[10px]">Test user_id</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-[34px] w-[150px] font-mono text-xs"
            />
          </div>
          <Button size="sm" disabled={!clientId || busy !== null} onClick={() => void runAll()}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> Run all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {selected && (!selected.callback_url || !selected.callback_secret || !selected.callback_enabled) && (
          <p className="border border-destructive/40 bg-destructive/10 p-2 font-mono text-[11px] text-destructive">
            This key is not ready: {[
              !selected.callback_enabled && "callback mode off",
              !selected.callback_url && "no callback URL",
              !selected.callback_secret && "no HMAC secret",
            ].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {OPS.map((op) => {
            const last = lastFor(op);
            return (
              <div key={op} className="border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{op}</span>
                  {last && (last.ok
                    ? <CheckCircle2 className="h-4 w-4 text-primary" />
                    : <XCircle className="h-4 w-4 text-destructive" />)}
                </div>
                <div className="mt-2 min-h-[42px] font-mono text-[11px]">
                  {last ? (
                    <>
                      <div className={last.ok ? "text-primary" : "text-destructive"}>
                        {last.ok ? `success · ${last.status}` : `error · ${last.status}`}
                      </div>
                      <div className="truncate text-muted-foreground" title={last.message}>{last.message}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(last.at).toLocaleString()}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">never run</span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  disabled={!clientId || busy !== null}
                  onClick={() => void run(op)}
                >
                  {busy === op ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
                  Dry-run
                </Button>
              </div>
            );
          })}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          Dry-runs send a signed request with amount 0 and <code>dry_run: true</code> — no wallet movement.
          Every attempt is stored in the callback logs as <code>Test:&lt;operation&gt;</code>.
        </p>
      </CardContent>
    </Card>
  );
}
