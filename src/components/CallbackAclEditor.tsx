import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCachedData, invalidateCache } from "@/lib/use-cached";
import {
  listCallbackAcl, addCallbackAclEntry, removeCallbackAclEntry,
} from "@/lib/callback.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Network, Plus, Trash2, ShieldCheck } from "lucide-react";

const OPS = ["", "token", "GetBalance", "PlaceBet", "WinLoss"] as const;
type Kind = "domain" | "ip";

function OpBadge({ op }: { op: string | null }) {
  return (
    <span
      className={`px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        op ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {op ?? "all ops"}
    </span>
  );
}

export function CallbackAclEditor({ clientId, scope }: { clientId: string; scope: string }) {
  const fetchAcl = useServerFn(listCallbackAcl);
  const addEntry = useServerFn(addCallbackAclEntry);
  const delEntry = useServerFn(removeCallbackAclEntry);

  const cacheKey = `${scope}:cb:acl:${clientId}`;
  const { data, refetch, isFetching } = useCachedData<Awaited<ReturnType<typeof listCallbackAcl>>>(
    cacheKey, () => fetchAcl({ data: { client_id: clientId } }), { staleTime: 20_000 },
  );

  const [draft, setDraft] = useState<Record<Kind, { value: string; op: string; label: string }>>({
    domain: { value: "", op: "", label: "" },
    ip: { value: "", op: "", label: "" },
  });
  const [busy, setBusy] = useState(false);

  const reload = async () => { invalidateCache(cacheKey); await refetch(); };

  const onAdd = async (kind: Kind) => {
    const d = draft[kind];
    if (!d.value.trim()) { toast.error(kind === "domain" ? "Enter a domain" : "Enter an IP"); return; }
    setBusy(true);
    try {
      await addEntry({
        data: {
          client_id: clientId,
          kind,
          value: d.value.trim(),
          op: d.op ? (d.op as "token" | "GetBalance" | "PlaceBet" | "WinLoss") : null,
          label: d.label.trim() || undefined,
        },
      });
      setDraft((s) => ({ ...s, [kind]: { value: "", op: "", label: "" } }));
      await reload();
      toast.success(kind === "domain" ? "Domain whitelisted" : "IP whitelisted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally { setBusy(false); }
  };

  const onRemove = async (kind: Kind, id: string) => {
    setBusy(true);
    try {
      await delEntry({ data: { kind, id } });
      await reload();
      toast.success("Removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    } finally { setBusy(false); }
  };

  const domains = data?.domains ?? [];
  const ips = data?.ips ?? [];

  const rows = (kind: Kind) => (kind === "domain" ? domains : ips);

  const section = (kind: Kind) => {
    const isDomain = kind === "domain";
    const d = draft[kind];
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {isDomain ? <Globe className="h-3.5 w-3.5 text-primary" /> : <Network className="h-3.5 w-3.5 text-primary" />}
          <span className="label-mono text-[10px]">
            {isDomain ? "allowed domains" : "allowed ips"} ({rows(kind).length})
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="label-mono text-[10px]">{isDomain ? "Domain" : "IP address"}</Label>
            <Input
              value={d.value}
              placeholder={isDomain ? "their-domain.com  or  *.their-domain.com" : "203.0.113.10"}
              onChange={(e) => setDraft((s) => ({ ...s, [kind]: { ...d, value: e.target.value } }))}
              className="h-[34px] w-[230px] font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="label-mono text-[10px]">Operation</Label>
            <select
              value={d.op}
              onChange={(e) => setDraft((s) => ({ ...s, [kind]: { ...d, op: e.target.value } }))}
              className="block h-[34px] border border-border bg-background px-2 font-mono text-xs"
            >
              {OPS.map((o) => <option key={o} value={o}>{o || "all operations"}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="label-mono text-[10px]">Label</Label>
            <Input
              value={d.label}
              placeholder="optional note"
              onChange={(e) => setDraft((s) => ({ ...s, [kind]: { ...d, label: e.target.value } }))}
              className="h-[34px] w-[140px] font-mono text-xs"
            />
          </div>
          <Button size="sm" disabled={busy} onClick={() => void onAdd(kind)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {rows(kind).length === 0 ? (
          <p className="font-mono text-[11px] text-destructive">
            Nothing whitelisted — every {isDomain ? "domain" : "IP"} is rejected.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {isDomain
              ? domains.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 border border-border/60 bg-muted/10 px-2 py-1">
                    <code className="font-mono text-[11px]">{r.domain}</code>
                    <OpBadge op={r.op} />
                    {r.label && <span className="text-[10px] text-muted-foreground">{r.label}</span>}
                    <button
                      type="button"
                      aria-label={`Remove domain ${r.domain}`}
                      disabled={busy}
                      onClick={() => void onRemove("domain", r.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              : ips.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 border border-border/60 bg-muted/10 px-2 py-1">
                    <code className="font-mono text-[11px]">{r.ip_address}</code>
                    <OpBadge op={r.op} />
                    {r.label && <span className="text-[10px] text-muted-foreground">{r.label}</span>}
                    <button
                      type="button"
                      aria-label={`Remove IP ${r.ip_address}`}
                      disabled={busy}
                      onClick={() => void onRemove("ip", r.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-3 space-y-4 border border-border/40 bg-muted/5 p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span className="label-mono text-[10px]">whitelist — per key & operation</span>
        {isFetching && <span className="font-mono text-[10px] text-muted-foreground">loading…</span>}
      </div>
      {section("domain")}
      {section("ip")}
      <p className="font-mono text-[10px] text-muted-foreground">
        Entries marked <span className="text-foreground">all operations</span> apply to every callback.
        An entry scoped to one operation only allows that operation — use <code>*</code> to allow everything.
      </p>
    </div>
  );
}
