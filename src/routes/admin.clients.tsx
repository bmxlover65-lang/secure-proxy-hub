import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateClient, adminUpdateClient, adminDeleteClient,
  adminRegenerateKey, adminSetIps, adminSetDomains,
} from "@/server/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Copy, Network, Users, Search, Power, PowerOff, Loader2, Globe, CalendarClock, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/clients")({
  component: ClientsPage,
});

const CATEGORIES = ["wingo", "k3", "d5", "motorace"] as const;
type Category = typeof CATEGORIES[number];

type Client = {
  id: string; name: string; api_key: string; status: "active" | "suspended";
  category: string; duration_days: number | null; expires_at: string | null;
  notes: string | null; created_at: string;
};

function daysLeft(expires_at: string | null): number | null {
  if (!expires_at) return null;
  return Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400_000);
}

function ClientsPage() {
  const [list, setList] = useState<Client[]>([]);
  const [ipMap, setIpMap] = useState<Record<string, string[]>>({});
  const [domainMap, setDomainMap] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState(false);
  const [ipDialog, setIpDialog] = useState<Client | null>(null);
  const [ipText, setIpText] = useState("");
  const [domainDialog, setDomainDialog] = useState<Client | null>(null);
  const [domainText, setDomainText] = useState("");
  const [domainTest, setDomainTest] = useState("sass.hyperapi.in");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [extendId, setExtendId] = useState<Client | null>(null);
  const [extendDays, setExtendDays] = useState(30);

  const create = useServerFn(adminCreateClient);
  const update = useServerFn(adminUpdateClient);
  const del = useServerFn(adminDeleteClient);
  const regen = useServerFn(adminRegenerateKey);
  const setIps = useServerFn(adminSetIps);
  const setDomains = useServerFn(adminSetDomains);

  const load = useCallback(async () => {
    const { data: rs } = await supabase.from("api_clients").select("*").order("created_at", { ascending: false });
    setList((rs as Client[] | null) ?? []);
    const { data: ips } = await supabase.from("allowed_ips").select("client_id, ip_address");
    const im: Record<string, string[]> = {};
    (ips ?? []).forEach((r) => { (im[r.client_id] ??= []).push(r.ip_address); });
    setIpMap(im);
    const { data: doms } = await supabase.from("allowed_domains").select("client_id, domain");
    const dm: Record<string, string[]> = {};
    (doms ?? []).forEach((r) => { (dm[r.client_id] ??= []).push(r.domain); });
    setDomainMap(dm);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied to clipboard"); };

  function domainMatches(host: string, pattern: string): boolean {
    const h = host.toLowerCase().trim();
    const p = pattern.toLowerCase().trim();
    if (!p || !h) return false;
    if (p.startsWith("*.")) {
      const base = p.slice(2);
      return h === base || h.endsWith("." + base);
    }
    return h === p;
  }

  const filtered = list.filter((r) => {
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return r.name.toLowerCase().includes(s) || r.api_key.toLowerCase().includes(s);
  });
  const activeCount = list.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="API Clients"
        description="Per-category API keys with IP, domain & duration controls."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "var(--gradient-primary)" }} className="text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> New client
              </Button>
            </DialogTrigger>
            <CreateClientDialog
              onCreate={async (payload) => {
                try {
                  await create({ data: payload });
                  toast.success("Client created");
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

      <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">All clients</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-72 max-w-full">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name or key…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/40">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{search ? "No matches" : "No clients yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">API Key</th>
                    <th className="pb-3 font-medium">IPs</th>
                    <th className="pb-3 font-medium">Domains</th>
                    <th className="pb-3 font-medium">Expires</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isBusy = busyId === r.id;
                    const ips = ipMap[r.id] ?? [];
                    const doms = domainMap[r.id] ?? [];
                    const dl = daysLeft(r.expires_at);
                    const expired = dl !== null && dl <= 0;
                    return (
                      <tr key={r.id} className="border-b border-border/30 transition-colors hover:bg-secondary/30">
                        <td className="py-3">
                          <div className="font-medium">{r.name}</div>
                          {r.notes && <div className="text-xs text-muted-foreground">{r.notes}</div>}
                        </td>
                        <td><Badge variant="outline" className="font-mono uppercase">{r.category}</Badge></td>
                        <td>
                          <button className="group flex items-center gap-1.5 rounded-md bg-secondary/40 px-2 py-1 font-mono text-xs hover:bg-secondary/70" onClick={() => copy(r.api_key)}>
                            {r.api_key.slice(0, 16)}…
                            <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                          </button>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${ips.length > 0 ? "bg-secondary/40" : "bg-destructive/10 text-destructive"}`}>
                            <Network className="h-3 w-3" /> {ips.length || "None"}
                          </span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${doms.length > 0 ? "bg-secondary/40" : "bg-destructive/10 text-destructive"}`}>
                            <Globe className="h-3 w-3" /> {doms.length || "None"}
                          </span>
                        </td>
                        <td className="text-xs">
                          {dl === null ? <span className="text-muted-foreground">—</span> :
                            expired ? <span className="text-destructive">Expired</span> :
                            <span className={dl <= 7 ? "text-warning" : "text-muted-foreground"}>{dl}d left</span>}
                        </td>
                        <td>
                          <Badge variant="outline" className={r.status === "active"
                            ? "border-success/30 bg-success/15 text-success"
                            : "border-destructive/30 bg-destructive/15 text-destructive"}>
                            <span className={`mr-1 h-1.5 w-1.5 rounded-full ${r.status === "active" ? "bg-success" : "bg-destructive"}`} />
                            {r.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Extend duration"
                              onClick={() => { setExtendId(r); setExtendDays(30); }}>
                              <CalendarClock className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Manage IPs"
                              onClick={() => { setIpDialog(r); setIpText((ipMap[r.id] ?? []).join("\n")); }}>
                              <Network className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Manage Domains"
                              onClick={() => { setDomainDialog(r); setDomainText((domainMap[r.id] ?? []).join("\n")); setDomainTest("sass.hyperapi.in"); }}>
                              <Globe className="h-4 w-4" />
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
            <DialogDescription>One IP per line. At least one IP is required.</DialogDescription>
          </DialogHeader>
          <Textarea rows={8} value={ipText} onChange={(e) => setIpText(e.target.value)}
            placeholder="203.0.113.10" className="font-mono text-sm" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIpDialog(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!ipDialog) return;
              const ips = ipText.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
              try { await setIps({ data: { client_id: ipDialog.id, ips } }); toast.success("IPs updated"); setIpDialog(null); load(); }
              catch (e) { toast.error((e as Error).message); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!domainDialog} onOpenChange={(o) => !o && setDomainDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allowed Domains — {domainDialog?.name}</DialogTitle>
            <DialogDescription>One hostname per line. Use <span className="font-mono">*.example.com</span> for wildcard subdomains.</DialogDescription>
          </DialogHeader>
          <Textarea rows={6} value={domainText} onChange={(e) => setDomainText(e.target.value)}
            placeholder="example.com&#10;*.example.com&#10;sass.hyperapi.in" className="font-mono text-sm" />
          <div className="space-y-2 rounded-md border border-border/60 bg-secondary/20 p-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Test a hostname</Label>
            <div className="flex gap-2">
              <Input value={domainTest} onChange={(e) => setDomainTest(e.target.value)} placeholder="sass.hyperapi.in" className="font-mono text-xs" />
              {(() => {
                const patterns = domainText.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
                const match = patterns.find((p) => domainMatches(domainTest, p));
                return match ? (
                  <Badge className="bg-success/20 text-success"><CheckCircle2 className="mr-1 h-3 w-3" />Matches {match}</Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/40 text-destructive"><XCircle className="mr-1 h-3 w-3" />No match</Badge>
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDomainDialog(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!domainDialog) return;
              const domains = domainText.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
              try { await setDomains({ data: { client_id: domainDialog.id, domains } }); toast.success("Domains updated"); setDomainDialog(null); load(); }
              catch (e) { toast.error((e as Error).message); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendId} onOpenChange={(o) => !o && setExtendId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend duration — {extendId?.name}</DialogTitle>
            <DialogDescription>Add days to the existing expiry (or restart from today if expired).</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Days to add</Label>
            <Input type="number" min={1} value={extendDays} onChange={(e) => setExtendDays(Number(e.target.value))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendId(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!extendId) return;
              try { await update({ data: { id: extendId.id, extend_days: extendDays } }); toast.success("Duration extended"); setExtendId(null); load(); }
              catch (e) { toast.error((e as Error).message); }
            }}>Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateClientDialog({ onCreate }: { onCreate: (p: { name: string; category: Category; duration_days: number; allowed_ips: string[]; allowed_domains: string[]; notes?: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("wingo");
  const [days, setDays] = useState(30);
  const [ips, setIps] = useState("");
  const [domains, setDomains] = useState("sass.hyperapi.in");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create a new API client</DialogTitle>
        <DialogDescription>One key per game category. Pick the category and duration.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Name</Label><Input placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Game category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Duration (days)</Label><Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
        </div>
        <div className="space-y-2"><Label>Allowed IPs (one per line)</Label><Textarea rows={3} value={ips} onChange={(e) => setIps(e.target.value)} placeholder="203.0.113.10" className="font-mono text-sm" /></div>
        <div className="space-y-2"><Label>Allowed Domains (one per line)</Label><Textarea rows={3} value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="example.com&#10;*.example.com" className="font-mono text-sm" /></div>
        <div className="space-y-2"><Label>Notes (optional)</Label><Input placeholder="Internal reference" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button
          disabled={submitting || !name.trim() || days < 1}
          style={{ background: "var(--gradient-primary)" }}
          className="text-primary-foreground"
          onClick={async () => {
            setSubmitting(true);
            try {
              await onCreate({
                name, category, duration_days: days,
                allowed_ips: ips.split(/\s|,/).map((s) => s.trim()).filter(Boolean),
                allowed_domains: domains.split(/\s|,/).map((s) => s.trim()).filter(Boolean),
                notes: notes || undefined,
              });
            } finally { setSubmitting(false); }
          }}
        >
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create client"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
