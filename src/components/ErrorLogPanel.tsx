import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCachedData } from "@/lib/use-cached";
import { listErrorLogs, type ErrorEntry } from "@/lib/errors.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, RefreshCw, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";

const SOURCES = ["all", "callback", "request"] as const;

function toIso(v: string, end = false): string | undefined {
  if (!v) return undefined;
  const d = new Date(end ? `${v}T23:59:59` : `${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function pretty(v: unknown): string {
  if (v === null || v === undefined) return "—";
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

function Row({ e }: { e: ErrorEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/60 bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left hover:bg-muted/30"
      >
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {new Date(e.created_at).toLocaleString()}
        </span>
        <span className={`border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${e.source === "callback" ? "border-primary/50 text-primary" : "border-border text-muted-foreground"}`}>
          {e.source}
        </span>
        <span className="text-xs font-medium">{e.kind}</span>
        {e.status_code !== null && (
          <span className="border border-destructive/50 px-1.5 py-0.5 text-[10px] text-destructive tabular-nums">
            {e.status_code}
          </span>
        )}
        {e.signature_status && e.signature_status !== "valid" && (
          <span className="border border-destructive/40 px-1.5 py-0.5 text-[10px] uppercase text-destructive">
            sig: {e.signature_status}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-xs text-destructive">{e.message}</span>
        <span className="text-[11px] text-muted-foreground">{e.client_name ?? "—"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/60 px-3 py-3 text-xs">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Client", e.client_name ?? "—"],
              ["User id", e.external_user_id ?? "—"],
              ["IP", e.ip_address ?? "—"],
              ["Host", e.host ?? "—"],
              ["Latency", e.response_time_ms !== null ? `${e.response_time_ms} ms` : "—"],
              ["Signature", e.signature_status ?? "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="break-all">{v}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {([["Request payload", e.request_payload], ["Response payload", e.response_payload]] as const).map(([label, val]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
                  <Button
                    variant="ghost" size="sm" className="h-6 px-2"
                    onClick={() => { void navigator.clipboard.writeText(pretty(val)); toast.success("Copied"); }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="max-h-64 overflow-auto border border-border/60 bg-muted/20 p-2 text-[11px] leading-relaxed">
                  {pretty(val)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorLogPanel() {
  const fetchErrors = useServerFn(listErrorLogs);
  const [source, setSource] = useState<(typeof SOURCES)[number]>("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const key = `error-log:${source}:${search}:${from}:${to}`;
  const { data, isFetching, refetch } = useCachedData<{ entries: ErrorEntry[]; counts: Record<string, number> }>(key, () =>
    fetchErrors({
      data: {
        limit: 200, source,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(toIso(from) ? { from: toIso(from) } : {}),
        ...(toIso(to, true) ? { to: toIso(to, true) } : {}),
      },
    }),
  );
  const entries = data?.entries ?? [];
  const counts = data?.counts;

  return (
    <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="font-display flex items-center gap-2 text-base uppercase tracking-tight">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Error log
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Total", counts?.total ?? 0],
            ["Callback", counts?.callback ?? 0],
            ["Data API", counts?.request ?? 0],
            ["Signature", counts?.signature ?? 0],
            ["Whitelist", counts?.whitelist ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="border border-border/60 bg-background/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
              <div className="text-lg tabular-nums">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Source</Label>
            <div className="mt-1 flex gap-1">
              {SOURCES.map((s) => (
                <Button
                  key={s} size="sm" variant={source === s ? "default" : "outline"}
                  className="h-8 px-2 text-[11px] uppercase"
                  onClick={() => setSource(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Search</Label>
            <Input className="mt-1 h-8" placeholder="message / ip / key / user" value={search} onChange={(ev) => setSearch(ev.target.value)} />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">From</Label>
            <Input type="date" className="mt-1 h-8" value={from} onChange={(ev) => setFrom(ev.target.value)} />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">To</Label>
            <Input type="date" className="mt-1 h-8" value={to} onChange={(ev) => setTo(ev.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          {entries.length === 0 ? (
            <div className="border border-dashed border-border/60 px-3 py-8 text-center text-xs text-muted-foreground">
              {isFetching ? "Loading errors…" : "No errors in this range — sab clean hai."}
            </div>
          ) : (
            entries.map((e: ErrorEntry) => <Row key={e.id} e={e} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
