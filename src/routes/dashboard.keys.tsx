import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyOverview, resellerCreateClient, resellerDeleteClient, resellerUpdateClient, resellerSetIps, resellerSetDomains } from "@/lib/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { KeyRound, Plus, Copy, Trash2, Power, PowerOff, Coins, Network, Globe } from "lucide-react";

export const Route = createFileRoute("/dashboard/keys")({ component: KeysPage });

function KeysPage() {
  const fetchOverview = useServerFn(getMyOverview);
  const create = useServerFn(resellerCreateClient);
  const del = useServerFn(resellerDeleteClient);
  const update = useServerFn(resellerUpdateClient);
  const setIps = useServerFn(resellerSetIps);
  const setDomains = useServerFn(resellerSetDomains);
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyOverview>> | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"wingo" | "k3" | "d5" | "motorace">("wingo");
  const [submitting, setSubmitting] = useState(false);
  const [ipMap, setIpMap] = useState<Record<string, string[]>>({});
  const [domainMap, setDomainMap] = useState<Record<string, string[]>>({});
  const [ipDialog, setIpDialog] = useState<{ id: string; name: string } | null>(null);
  const [ipText, setIpText] = useState("");
  const [domainDialog, setDomainDialog] = useState<{ id: string; name: string } | null>(null);
  const [domainText, setDomainText] = useState("");
  const [initialIps, setInitialIps] = useState("");
  const [initialDomains, setInitialDomains] = useState("");

  const reload = useCallback(async () => {
    try {
      const ov = await fetchOverview(); setData(ov);
      const ids = (ov.clients ?? []).map((c) => c.id);
      if (ids.length === 0) { setIpMap({}); setDomainMap({}); return; }
      const [{ data: ips }, { data: doms }] = await Promise.all([
        supabase.from("allowed_ips").select("client_id, ip_address").in("client_id", ids),
        supabase.from("allowed_domains").select("client_id, domain").in("client_id", ids),
      ]);
      const im: Record<string, string[]> = {}; (ips ?? []).forEach((r) => { (im[r.client_id] ??= []).push(r.ip_address); });
      const dm: Record<string, string[]> = {}; (doms ?? []).forEach((r) => { (dm[r.client_id] ??= []).push(r.domain); });
      setIpMap(im); setDomainMap(dm);
    } catch { /* ignore */ }
  }, [fetchOverview]);
  useEffect(() => { reload(); }, [reload]);

  const cost = Number(data?.settings.coins_per_api_key ?? 1000);
  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const keys = data?.clients ?? [];

  const submit = async () => {
    if (!name.trim()) return toast.error("Name required");
    if (balance < cost) return toast.error("Insufficient balance. Top up your wallet.");
    setSubmitting(true);
    try {
      // Fixed 30-day validity, IP/domain whitelist managed after creation
      const res = await create({ data: { name: name.trim(), category, duration_days: 30, allowed_ips: ["*"], allowed_domains: ["*"] } });
      toast.success(`API key created. ${cost} coins charged.`);
      navigator.clipboard.writeText(res.client.api_key);
      setOpen(false); setName(""); reload();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        title="API Keys"
        description={`Each new key costs ${cost.toLocaleString()} coins and is valid for 30 days. Your balance: ${balance.toLocaleString()}.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> New API Key</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>This will deduct <strong>{cost.toLocaleString()} coins</strong> from your wallet. Validity is fixed at <strong>30 days</strong>.</DialogDescription>
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
                <div className="flex items-center gap-2 rounded-md bg-secondary/40 p-3 text-sm"><Coins className="h-4 w-4 text-primary" /> Cost: <strong>{cost.toLocaleString()} coins</strong></div>
                <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  Validity: <strong className="text-foreground">30 days</strong> (fixed). After creation you can configure IP and domain whitelist for this key.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={submitting || balance < cost}>Create & Pay</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          {keys.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No API keys yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60"><th className="p-4">Name</th><th>Category</th><th>API Key</th><th>IPs</th><th>Domains</th><th>Expires</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const ips = ipMap[k.id] ?? [];
                  const doms = domainMap[k.id] ?? [];
                  const dl = k.expires_at ? Math.ceil((new Date(k.expires_at).getTime() - Date.now()) / 86400_000) : null;
                  return (
                  <tr key={k.id} className="border-b border-border/30">
                    <td className="p-4 font-medium">{k.name}</td>
                    <td className="font-mono text-xs uppercase">{k.category}</td>
                    <td>
                      <button className="flex items-center gap-1 rounded bg-secondary/40 px-2 py-1 font-mono text-xs" onClick={() => { navigator.clipboard.writeText(k.api_key); toast.success("Copied"); }}>
                        {k.api_key.slice(0, 20)}… <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${ips.length ? "bg-secondary/40" : "bg-destructive/10 text-destructive"}`}><Network className="h-3 w-3" />{ips.length || "None"}</span></td>
                    <td><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${doms.length ? "bg-secondary/40" : "bg-destructive/10 text-destructive"}`}><Globe className="h-3 w-3" />{doms.length || "None"}</span></td>
                    <td className="text-xs">{dl === null ? "—" : dl <= 0 ? <span className="text-destructive">Expired</span> : <span className={dl <= 7 ? "text-warning" : "text-muted-foreground"}>{dl}d left</span>}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs ${k.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{k.status}</span></td>
                    <td className="text-right pr-4">
                      <Button size="sm" variant="ghost" title="Manage IPs" onClick={() => { setIpDialog({ id: k.id, name: k.name }); const t = (ipMap[k.id] ?? []).join("\n"); setIpText(t); setInitialIps(t); }}>
                        <Network className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Manage Domains" onClick={() => { setDomainDialog({ id: k.id, name: k.name }); const t = (domainMap[k.id] ?? []).join("\n"); setDomainText(t); setInitialDomains(t); }}>
                        <Globe className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => { try { await update({ data: { id: k.id, status: k.status === "active" ? "suspended" : "active" } }); reload(); } catch (e) { toast.error((e as Error).message); } }}>
                        {k.status === "active" ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("Delete?")) return; try { await del({ data: { id: k.id } }); toast.success("Deleted"); reload(); } catch (e) { toast.error((e as Error).message); } }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!ipDialog} onOpenChange={(o) => !o && setIpDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allowed IPs — {ipDialog?.name}</DialogTitle>
            <DialogDescription>One IP per line. Use <code>*</code> to allow all (not recommended).</DialogDescription>
          </DialogHeader>
          <Textarea rows={8} value={ipText} onChange={(e) => setIpText(e.target.value)} placeholder="203.0.113.10" className="font-mono text-sm" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIpDialog(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!ipDialog) return;
              if (ipText === initialIps) { setIpDialog(null); return; }
              const ips = ipText.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
              try { await setIps({ data: { client_id: ipDialog.id, ips } }); toast.success("IPs updated"); setIpDialog(null); reload(); }
              catch (e) { toast.error((e as Error).message); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!domainDialog} onOpenChange={(o) => !o && setDomainDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allowed Domains — {domainDialog?.name}</DialogTitle>
            <DialogDescription>One hostname per line. Use <code>*.example.com</code> for wildcard subdomains, or <code>*</code> to allow all (not recommended).</DialogDescription>
          </DialogHeader>
          <Textarea rows={6} value={domainText} onChange={(e) => setDomainText(e.target.value)} placeholder="example.com&#10;*.example.com" className="font-mono text-sm" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDomainDialog(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!domainDialog) return;
              if (domainText === initialDomains) { setDomainDialog(null); return; }
              const domains = domainText.split(/\s|,/).map((s) => s.trim()).filter(Boolean);
              try { await setDomains({ data: { client_id: domainDialog.id, domains } }); toast.success("Domains updated"); setDomainDialog(null); reload(); }
              catch (e) { toast.error((e as Error).message); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}