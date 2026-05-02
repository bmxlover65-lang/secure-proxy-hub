import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateReseller, adminUpdateReseller, adminDeleteReseller,
  adminRegenerateKey, adminSetIps,
} from "@/server/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Copy, Network, Users, Search, Power, PowerOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/resellers")({
  component: ResellersPage,
});

type Reseller = {
  id: string; name: string; api_key: string; status: "active" | "suspended";
  rate_limit_per_minute: number; notes: string | null; created_at: string;
};

function ResellersPage() {
  const [list, setList] = useState<Reseller[]>([]);
  const [ipMap, setIpMap] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState(false);
  const [ipDialog, setIpDialog] = useState<Reseller | null>(null);
  const [ipText, setIpText] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const create = useServerFn(adminCreateReseller);
  const update = useServerFn(adminUpdateReseller);
  const del = useServerFn(adminDeleteReseller);
  const regen = useServerFn(adminRegenerateKey);
  const setIps = useServerFn(adminSetIps);

  const load = useCallback(async () => {
    const { data: rs } = await supabase.from("resellers").select("*").order("created_at", { ascending: false });
    setList((rs as Reseller[]) ?? []);
    const { data: ips } = await supabase.from("allowed_ips").select("reseller_id, ip_address");
    const map: Record<string, string[]> = {};
    (ips ?? []).forEach((r: any) => { (map[r.reseller_id] ??= []).push(r.ip_address); });
    setIpMap(map);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied to clipboard"); };

  const filtered = list.filter((r) =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.api_key.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = list.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Resellers"
        description="Create and manage API keys with IP whitelisting and rate limits."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "var(--gradient-primary)" }} className="text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> New reseller
              </Button>
            </DialogTrigger>
            <CreateResellerDialog
              onCreate={async (payload) => {
                try {
                  await create({ data: payload });
                  toast.success("Reseller created");
                  setOpen(false);
                  load();
                } catch (e) { toast.error((e as Error).message); }
              }}
            />
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="mt-1 text-2xl font-bold">{list.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Active</div>
            <div className="mt-1 text-2xl font-bold text-success">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Suspended</div>
            <div className="mt-1 text-2xl font-bold text-destructive">{list.length - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>All resellers ({filtered.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or key…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/40">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{search ? "No matches" : "No resellers yet"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search ? "Try a different search term." : "Create your first reseller to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">API Key</th>
                    <th className="pb-3 font-medium">IPs</th>
                    <th className="pb-3 font-medium">Rate</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isBusy = busyId === r.id;
                    return (
                      <tr key={r.id} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                        <td className="py-3">
                          <div className="font-medium">{r.name}</div>
                          {r.notes && <div className="text-xs text-muted-foreground">{r.notes}</div>}
                        </td>
                        <td>
                          <button className="group flex items-center gap-1.5 rounded-md bg-secondary/40 px-2 py-1 font-mono text-xs hover:bg-secondary/70" onClick={() => copy(r.api_key)}>
                            {r.api_key.slice(0, 16)}…
                            <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                          </button>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/40 px-2 py-0.5 text-xs">
                            <Network className="h-3 w-3" />
                            {(ipMap[r.id] ?? []).length || "Any"}
                          </span>
                        </td>
                        <td className="text-xs text-muted-foreground">{r.rate_limit_per_minute}/min</td>
                        <td>
                          <Badge
                            variant="outline"
                            className={r.status === "active"
                              ? "border-success/30 bg-success/15 text-success"
                              : "border-destructive/30 bg-destructive/15 text-destructive"}
                          >
                            <span className={`mr-1 h-1.5 w-1.5 rounded-full ${r.status === "active" ? "bg-success" : "bg-destructive"}`} />
                            {r.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Manage IPs"
                              onClick={() => { setIpDialog(r); setIpText((ipMap[r.id] ?? []).join("\n")); }}>
                              <Network className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                              title={r.status === "active" ? "Suspend" : "Activate"}
                              disabled={isBusy}
                              onClick={async () => {
                                const next = r.status === "active" ? "suspended" : "active";
                                setBusyId(r.id);
                                try { await update({ data: { id: r.id, status: next } }); toast.success(`Set to ${next}`); load(); }
                                catch (e) { toast.error((e as Error).message); }
                                finally { setBusyId(null); }
                              }}>
                              {r.status === "active" ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Regenerate key"
                              disabled={isBusy}
                              onClick={async () => {
                                if (!confirm(`Regenerate API key for ${r.name}? The old key will stop working.`)) return;
                                setBusyId(r.id);
                                try { const { api_key } = await regen({ data: { id: r.id } }); copy(api_key); toast.success("Key regenerated"); load(); }
                                catch (e) { toast.error((e as Error).message); }
                                finally { setBusyId(null); }
                              }}>
                              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/15 hover:text-destructive" title="Delete"
                              disabled={isBusy}
                              onClick={async () => {
                                if (!confirm(`Delete ${r.name}? This cannot be undone.`)) return;
                                setBusyId(r.id);
                                try { await del({ data: { id: r.id } }); toast.success("Deleted"); load(); }
                                catch (e) { toast.error((e as Error).message); }
                                finally { setBusyId(null); }
                              }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!ipDialog} onOpenChange={(o) => !o && setIpDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allowed IPs — {ipDialog?.name}</DialogTitle>
            <DialogDescription>One IP address per line. Leave empty to allow any IP (not recommended).</DialogDescription>
          </DialogHeader>
          <Textarea rows={8} value={ipText} onChange={(e) => setIpText(e.target.value)}
            placeholder="203.0.113.10&#10;198.51.100.5" className="font-mono text-sm" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIpDialog(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!ipDialog) return;
              const ips = ipText.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
              try { await setIps({ data: { reseller_id: ipDialog.id, ips } }); toast.success("IPs updated"); setIpDialog(null); load(); }
              catch (e) { toast.error((e as Error).message); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateResellerDialog({ onCreate }: { onCreate: (p: { name: string; rate_limit_per_minute: number; allowed_ips: string[]; notes?: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState(60);
  const [ips, setIps] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create a new reseller</DialogTitle>
        <DialogDescription>A unique API key will be generated automatically.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Name</Label><Input placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Rate limit (requests / minute)</Label><Input type="number" min={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Allowed IPs (one per line, optional)</Label><Textarea rows={4} value={ips} onChange={(e) => setIps(e.target.value)} placeholder="203.0.113.10" className="font-mono text-sm" /></div>
        <div className="space-y-2"><Label>Notes (optional)</Label><Input placeholder="Internal reference" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button
          disabled={submitting || !name.trim()}
          style={{ background: "var(--gradient-primary)" }}
          className="text-primary-foreground"
          onClick={async () => {
            setSubmitting(true);
            try {
              await onCreate({
                name, rate_limit_per_minute: rate,
                allowed_ips: ips.split(/\s|,/).map((s) => s.trim()).filter(Boolean),
                notes: notes || undefined,
              });
            } finally { setSubmitting(false); }
          }}
        >
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create reseller"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
