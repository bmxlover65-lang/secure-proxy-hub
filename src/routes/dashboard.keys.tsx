import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyOverview,
  resellerCreateClient,
  resellerDeleteClient,
  resellerUpdateClient,
  resellerListAccess,
  resellerSetIps,
  resellerSetDomains,
} from "@/server/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { KeyRound, Plus, Copy, Trash2, Power, PowerOff, Coins, Shield, Calendar, Tag, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/dashboard/keys")({ component: KeysPage });

function KeysPage() {
  const fetchOverview = useServerFn(getMyOverview);
  const create = useServerFn(resellerCreateClient);
  const del = useServerFn(resellerDeleteClient);
  const update = useServerFn(resellerUpdateClient);
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyOverview>> | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"wingo" | "k3" | "d5" | "motorace">("wingo");
  const [submitting, setSubmitting] = useState(false);
  const [ipsText, setIpsText] = useState("");
  const [domainsText, setDomainsText] = useState("");
  const [accessKey, setAccessKey] = useState<{ id: string; name: string } | null>(null);

  const reload = useCallback(() => { fetchOverview().then(setData).catch(() => {}); }, [fetchOverview]);
  useEffect(() => { reload(); }, [reload]);

  const cost = Number(data?.settings.coins_per_api_key ?? 1000);
  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const keys = data?.clients ?? [];

  const submit = async () => {
    if (!name.trim()) return toast.error("Name required");
    if (balance < cost) return toast.error("Insufficient balance. Top up your wallet.");
    const ips = ipsText.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
    const domains = domainsText.split(/\s|,/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (ips.length === 0) return toast.error("Add at least one allowed IP");
    if (domains.length === 0) return toast.error("Add at least one allowed domain");
    setSubmitting(true);
    try {
      const res = await create({ data: { name: name.trim(), category, allowed_ips: ips, allowed_domains: domains } });
      toast.success(`API key created. ${cost} coins charged.`);
      navigator.clipboard.writeText(res.client.api_key);
      setOpen(false); setName(""); setIpsText(""); setDomainsText(""); reload();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        title="API Keys"
        description={`Manage your API keys. Each key costs ${cost.toLocaleString()} coins and is valid for 30 days.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "var(--gradient-primary)" }} className="text-primary-foreground shadow-lg">
                <Plus className="mr-1.5 h-4 w-4" /> New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>This will deduct <strong>{cost.toLocaleString()} coins</strong> from your wallet.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My production key" /></div>
                <div><Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["wingo","k3","d5","motorace"] as const).map(c => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Allowed IPs (one per line)</Label>
                  <Textarea rows={3} value={ipsText} onChange={(e) => setIpsText(e.target.value)} placeholder="203.0.113.10" className="font-mono text-sm" />
                  <p className="mt-1 text-[11px] text-muted-foreground">Required. Only these IPs can call this key.</p>
                </div>
                <div>
                  <Label>Allowed Domains (one per line)</Label>
                  <Textarea rows={3} value={domainsText} onChange={(e) => setDomainsText(e.target.value)} placeholder="example.com&#10;*.example.com" className="font-mono text-sm" />
                  <p className="mt-1 text-[11px] text-muted-foreground">Required. Only these domains can use this key.</p>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-secondary/40 p-3 text-sm"><Coins className="h-4 w-4 text-primary" /> Cost: <strong>{cost.toLocaleString()} coins</strong> · Validity: <strong>30 days</strong></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={submitting || balance < cost}>Create & Pay</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total keys" value={keys.length} icon={KeyRound} tone="default" />
        <StatTile label="Active" value={keys.filter(k => k.status === "active").length} icon={CheckCircle2} tone="success" />
        <StatTile label="Wallet" value={`${balance.toLocaleString()} coins`} icon={Coins} tone="primary" />
      </div>

      {keys.length === 0 ? (
        <Card style={{ background: "var(--gradient-card)" }} className="border-dashed border-border/60">
          <CardContent className="py-16 text-center">
            <KeyRound className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 font-semibold">No API keys yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first key to start using the API.</p>
            <Button className="mt-4" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Create API Key</Button>
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {keys.map((k) => {
              const exp = k.expires_at ? new Date(k.expires_at) : null;
              const daysLeft = exp ? Math.ceil((exp.getTime() - Date.now()) / 86_400_000) : null;
              const expired = daysLeft !== null && daysLeft <= 0;
              const expiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;
              const active = k.status === "active" && !expired;
              return (
                <Card key={k.id} className="group relative overflow-hidden border-border/60 transition-all hover:border-primary/50 hover:shadow-lg" style={{ background: "var(--gradient-card)" }}>
                  <div className={`absolute inset-x-0 top-0 h-0.5 ${active ? "bg-success" : "bg-destructive"}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold leading-tight">{k.name}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                            <Tag className="h-2.5 w-2.5" />{k.category}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                          }`}>
                            {active ? "Active" : (expired ? "Expired" : "Suspended")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(k.api_key); toast.success("API key copied"); }}
                      className="mt-4 flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 font-mono text-xs transition-colors hover:border-primary/40 hover:bg-background/60"
                    >
                      <span className="truncate">{k.api_key.slice(0, 14)}••••{k.api_key.slice(-6)}</span>
                      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </button>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className={`inline-flex items-center gap-1.5 ${expired ? "text-destructive" : expiringSoon ? "text-warning" : "text-muted-foreground"}`}>
                        {expired || expiringSoon ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                        {exp ? (
                          expired ? "Expired" :
                          daysLeft === 1 ? "Expires tomorrow" :
                          `${daysLeft} days left`
                        ) : "No expiry"}
                      </div>
                      <span className="text-muted-foreground">Created {new Date(k.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-1 border-t border-border/40 pt-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="flex-1" onClick={() => setAccessKey({ id: k.id, name: k.name })}>
                            <Shield className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Manage IPs & domains</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="flex-1" onClick={async () => { try { await update({ data: { id: k.id, status: k.status === "active" ? "suspended" : "active" } }); reload(); } catch (e) { toast.error((e as Error).message); } }}>
                            {k.status === "active" ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-success" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{k.status === "active" ? "Suspend" : "Activate"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={async () => { if (!confirm(`Delete "${k.name}"? This cannot be undone.`)) return; try { await del({ data: { id: k.id } }); toast.success("Key deleted"); reload(); } catch (e) { toast.error((e as Error).message); } }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      <AccessDialog client={accessKey} onClose={() => setAccessKey(null)} />
    </div>
  );
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof KeyRound; tone: "default" | "success" | "primary" }) {
  const toneCls = tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  const bgCls = tone === "success" ? "bg-success/10" : tone === "primary" ? "bg-primary/10" : "bg-secondary/40";
  return (
    <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgCls}`}>
          <Icon className={`h-5 w-5 ${toneCls}`} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`mt-0.5 truncate text-xl font-bold ${toneCls}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessDialog({ client, onClose }: { client: { id: string; name: string } | null; onClose: () => void }) {
  const list = useServerFn(resellerListAccess);
  const setIps = useServerFn(resellerSetIps);
  const setDoms = useServerFn(resellerSetDomains);
  const [ips, setIpsText] = useState("");
  const [doms, setDomsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    list({ data: { client_id: client.id } })
      .then((r) => { setIpsText(r.ips.join("\n")); setDomsText(r.domains.join("\n")); })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [client, list]);

  const save = async () => {
    if (!client) return;
    const ipArr = ips.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
    const domArr = doms.split(/\s|,/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (ipArr.length === 0) return toast.error("Add at least one IP");
    if (domArr.length === 0) return toast.error("Add at least one domain");
    setSaving(true);
    try {
      await setIps({ data: { client_id: client.id, ips: ipArr } });
      await setDoms({ data: { client_id: client.id, domains: domArr } });
      toast.success("Access list updated");
      onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!client} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Access — {client?.name}</DialogTitle>
          <DialogDescription>Only listed IPs and domains can use this API key.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Allowed IPs (one per line)</Label>
              <Textarea rows={4} value={ips} onChange={(e) => setIpsText(e.target.value)} className="font-mono text-sm" />
            </div>
            <div>
              <Label>Allowed Domains (one per line)</Label>
              <Textarea rows={4} value={doms} onChange={(e) => setDomsText(e.target.value)} className="font-mono text-sm" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}