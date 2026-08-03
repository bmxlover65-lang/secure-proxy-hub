import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCachedData, invalidateCache } from "@/lib/use-cached";
import {
  listCallbackClients, listCallbackLogs, listRecentTokens,
  updateCallbackSettings, regenerateCallbackSecret, getTokenStats,
} from "@/lib/callback.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, Save, KeyRound, Webhook } from "lucide-react";

const TYPES = ["", "TokenIssue", "TokenValidate", "GetBalance", "PlaceBet", "WinLoss"];
const TOKEN_STATES = ["all", "active", "used", "expired", "replayed"] as const;
const OPS: { key: "cb_token" | "cb_getbalance" | "cb_placebet" | "cb_winloss"; label: string }[] = [
  { key: "cb_token", label: "Token" },
  { key: "cb_getbalance", label: "GetBalance" },
  { key: "cb_placebet", label: "PlaceBet" },
  { key: "cb_winloss", label: "WinLoss" },
];

function toIso(v: string, end = false): string | undefined {
  if (!v) return undefined;
  const d = new Date(end ? `${v}T23:59:59` : `${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function copy(v: string) {
  void navigator.clipboard.writeText(v);
  toast.success("Copied");
}

export function CallbackPanel({ scope }: { scope: "admin" | "reseller" }) {
  const fetchClients = useServerFn(listCallbackClients);
  const fetchLogs = useServerFn(listCallbackLogs);
  const fetchTokens = useServerFn(listRecentTokens);
  const saveSettings = useServerFn(updateCallbackSettings);
  const regen = useServerFn(regenerateCallbackSecret);
  const fetchStats = useServerFn(getTokenStats);

  const [type, setType] = useState("");
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [userQ, setUserQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tokenState, setTokenState] = useState<(typeof TOKEN_STATES)[number]>("all");
  const [drafts, setDrafts] = useState<Record<string, { url: string; ttl: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const fromIso = toIso(from);
  const toIsoVal = toIso(to, true);
  const rangeKey = `${from}|${to}`;

  const { data: clientsData, refetch: refetchClients } = useCachedData<Awaited<ReturnType<typeof listCallbackClients>>>(
    `${scope}:cb:clients`, () => fetchClients(), { staleTime: 20_000 },
  );
  const { data: logsData, refetch: refetchLogs, isFetching } = useCachedData<Awaited<ReturnType<typeof listCallbackLogs>>>(
    `${scope}:cb:logs:${type}:${statusFilter}:${userQ}:${rangeKey}`,
    () => fetchLogs({
      data: {
        limit: 200,
        callback_type: type || undefined,
        status: statusFilter,
        external_user_id: userQ.trim() || undefined,
        from: fromIso,
        to: toIsoVal,
      },
    }),
    { staleTime: 10_000 },
  );
  const { data: tokensData, refetch: refetchTokens } = useCachedData<Awaited<ReturnType<typeof listRecentTokens>>>(
    `${scope}:cb:tokens:${tokenState}:${userQ}:${rangeKey}`,
    () => fetchTokens({
      data: {
        limit: 100,
        state: tokenState,
        external_user_id: userQ.trim() || undefined,
        from: fromIso,
        to: toIsoVal,
      },
    }),
    { staleTime: 10_000 },
  );
  const { data: statsData, refetch: refetchStats } = useCachedData<Awaited<ReturnType<typeof getTokenStats>>>(
    `${scope}:cb:tokenstats:${rangeKey}`,
    () => fetchStats({ data: { from: fromIso, to: toIsoVal } }),
    { staleTime: 10_000 },
  );

  const clients = clientsData?.clients ?? [];
  const logs = logsData?.logs ?? [];
  const tokens = tokensData?.tokens ?? [];
  const stats = statsData?.stats;
  const nameOf = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "—";

  const onSave = async (id: string, current: { callback_url: string | null; token_ttl_seconds: number }) => {
    const d = drafts[id] ?? { url: current.callback_url ?? "", ttl: String(current.token_ttl_seconds) };
    setBusy(id);
    try {
      await saveSettings({
        data: {
          client_id: id,
          callback_url: d.url.trim() ? d.url.trim() : null,
          token_ttl_seconds: Math.min(Math.max(Number(d.ttl) || 300, 30), 86400),
        },
      });
      invalidateCache(`${scope}:cb:clients`);
      await refetchClients();
      toast.success("Callback settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setBusy(null); }
  };

  const onToggle = async (id: string, enabled: boolean) => {
    setBusy(id);
    try {
      await saveSettings({ data: { client_id: id, callback_enabled: enabled, mode: enabled ? "callback" : "data" } });
      invalidateCache(`${scope}:cb:clients`);
      await refetchClients();
      toast.success(enabled ? "Callback mode enabled" : "Callback mode disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally { setBusy(null); }
  };

  const onOpToggle = async (
    id: string,
    key: "cb_token" | "cb_getbalance" | "cb_placebet" | "cb_winloss",
    value: boolean,
  ) => {
    setBusy(id);
    try {
      await saveSettings({ data: { client_id: id, [key]: value } });
      invalidateCache(`${scope}:cb:clients`);
      await refetchClients();
      toast.success(`${key.replace("cb_", "")} ${value ? "enabled" : "disabled"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally { setBusy(null); }
  };

  const refreshAll = () => {
    void refetchLogs();
    void refetchTokens();
    void refetchStats();
  };

  const onRegen = async (id: string) => {
    setBusy(id);
    try {
      const res = await regen({ data: { client_id: id } });
      invalidateCache(`${scope}:cb:clients`);
      await refetchClients();
      copy(res.callback_secret);
      toast.success("New HMAC secret generated & copied");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      {/* Per-client integration settings */}
      <Card style={{ background: "var(--gradient-card)" }} className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide">
            <Webhook className="h-4 w-4 text-primary" /> Token / Callback Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clients.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No API keys yet.</p>
          )}
          {clients.map((c) => {
            const d = drafts[c.id] ?? { url: c.callback_url ?? "", ttl: String(c.token_ttl_seconds ?? 300) };
            return (
              <div key={c.id} className="border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{c.name}</div>
                    <div className="label-mono text-[10px] text-muted-foreground">{c.category} · {c.api_key}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        c.mode === "callback"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.mode === "callback" ? "callback system" : "data / endpoint key"}
                    </span>
                    <span className="label-mono text-[10px]">callback mode</span>
                    <Switch
                      checked={!!c.callback_enabled}
                      disabled={busy === c.id}
                      onCheckedChange={(v) => void onToggle(c.id, v)}
                    />
                  </div>
                </div>

                {c.mode === "callback" && (
                  <div className="mt-3 flex flex-wrap items-center gap-4 border border-border/40 bg-muted/10 p-3">
                    <span className="label-mono text-[10px] text-muted-foreground">allowed operations</span>
                    {OPS.map((op) => (
                      <label key={op.key} className="flex items-center gap-2">
                        <Switch
                          checked={c[op.key] !== false}
                          disabled={busy === c.id}
                          onCheckedChange={(v) => void onOpToggle(c.id, op.key, v)}
                        />
                        <span className="font-mono text-[11px]">{op.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_auto]">
                  <div className="space-y-1.5">
                    <Label className="label-mono text-[10px]">Callback URL (their server)</Label>
                    <Input
                      value={d.url}
                      placeholder="https://their-domain.com/callback.php"
                      onChange={(e) => setDrafts((s) => ({ ...s, [c.id]: { ...d, url: e.target.value } }))}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="label-mono text-[10px]">Token TTL (sec)</Label>
                    <Input
                      value={d.ttl}
                      inputMode="numeric"
                      onChange={(e) => setDrafts((s) => ({ ...s, [c.id]: { ...d, ttl: e.target.value } }))}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" disabled={busy === c.id} onClick={() => void onSave(c.id, c)}>
                      <Save className="mr-1.5 h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="label-mono text-[10px]">HMAC secret</span>
                  <code className="max-w-full truncate border border-border/60 bg-muted/30 px-2 py-1 font-mono text-[11px]">
                    {c.callback_secret ?? "not generated"}
                  </code>
                  {c.callback_secret && (
                    <Button size="sm" variant="outline" onClick={() => copy(c.callback_secret!)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => void onRegen(c.id)}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> {c.callback_secret ? "Rotate" : "Generate"}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Callback logs */}
      <Card style={{ background: "var(--gradient-card)" }} className="border-border">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm uppercase tracking-wide">Callback Logs</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-border bg-background px-2 py-1.5 font-mono text-xs"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t || "all types"}</option>)}
            </select>
            <Button size="sm" variant={onlyFailed ? "default" : "outline"} onClick={() => setOnlyFailed((v) => !v)}>
              Failed only
            </Button>
            <Button size="sm" variant="outline" disabled={isFetching} onClick={() => void refetchLogs()}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No callback requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="p-3">Time</th><th>Type</th>{scope === "admin" && <th>Client</th>}
                    <th>User ID</th><th>Amount</th><th>Balance</th><th>Sig</th><th>Status</th><th>ms</th><th>IP</th><th>Domain</th><th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-border/30">
                      <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="font-mono text-xs">{l.callback_type}</td>
                      {scope === "admin" && <td className="text-xs">{nameOf(l.client_id)}</td>}
                      <td className="font-mono text-xs">{l.external_user_id ?? "—"}</td>
                      <td className="font-mono text-xs">{l.amount ?? "—"}</td>
                      <td className="font-mono text-xs">{l.new_balance ?? "—"}</td>
                      <td className="font-mono text-[10px]">{l.signature_status ?? "—"}</td>
                      <td>
                        <span className={`px-2 py-0.5 text-[11px] ${l.success ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                          {l.status_code ?? "—"}
                        </span>
                      </td>
                      <td className="text-xs">{l.response_time_ms ?? "—"}</td>
                      <td className="font-mono text-xs">{l.ip_address ?? "—"}</td>
                      <td className="font-mono text-xs">{l.host ?? "—"}</td>
                      <td className="max-w-[240px] truncate text-xs text-destructive">{l.error_message ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tokens */}
      <Card style={{ background: "var(--gradient-card)" }} className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide">
            <KeyRound className="h-4 w-4 text-primary" /> Recent Tokens
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => void refetchTokens()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {tokens.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No tokens issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="p-3">Issued</th>{scope === "admin" && <th>Client</th>}
                    <th>User ID</th><th>Token</th><th>Expires</th><th>State</th><th>IP</th><th>Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => {
                    const expired = new Date(t.expires_at).getTime() < Date.now();
                    const state = t.used_at ? "used" : expired ? "expired" : "valid";
                    return (
                      <tr key={t.id} className="border-b border-border/30">
                        <td className="p-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                        {scope === "admin" && <td className="text-xs">{nameOf(t.client_id)}</td>}
                        <td className="font-mono text-xs">{t.external_user_id}</td>
                        <td className="max-w-[160px] truncate font-mono text-[11px]">{t.token}</td>
                        <td className="text-xs text-muted-foreground">{new Date(t.expires_at).toLocaleTimeString()}</td>
                        <td>
                          <span className={`px-2 py-0.5 text-[11px] ${state === "valid" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {state}
                          </span>
                        </td>
                        <td className="font-mono text-xs">{t.ip_address ?? "—"}</td>
                        <td className="font-mono text-xs">{t.domain ?? "—"}</td>
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