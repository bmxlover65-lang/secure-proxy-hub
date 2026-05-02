import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview, resellerCreateClient, resellerDeleteClient, resellerUpdateClient } from "@/server/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { KeyRound, Plus, Copy, Trash2, Power, PowerOff, Coins } from "lucide-react";

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

  const reload = useCallback(() => { fetchOverview().then(setData).catch(() => {}); }, [fetchOverview]);
  useEffect(() => { reload(); }, [reload]);

  const cost = Number(data?.settings.coins_per_api_key ?? 1000);
  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const keys = data?.clients ?? [];

  const submit = async () => {
    if (!name.trim()) return toast.error("Name required");
    if (balance < cost) return toast.error("Insufficient balance. Top up your wallet.");
    setSubmitting(true);
    try {
      const res = await create({ data: { name: name.trim(), category, allowed_ips: ["*"], allowed_domains: ["*"] } });
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
        description={`Each new key costs ${cost.toLocaleString()} coins. Your balance: ${balance.toLocaleString()}.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> New API Key</Button></DialogTrigger>
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
                <div className="flex items-center gap-2 rounded-md bg-secondary/40 p-3 text-sm"><Coins className="h-4 w-4 text-primary" /> Cost: <strong>{cost.toLocaleString()} coins</strong> · Validity: <strong>13 days</strong></div>
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
                <tr className="border-b border-border/60"><th className="p-4">Name</th><th>Category</th><th>API Key</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-border/30">
                    <td className="p-4 font-medium">{k.name}</td>
                    <td className="font-mono text-xs uppercase">{k.category}</td>
                    <td>
                      <button className="flex items-center gap-1 rounded bg-secondary/40 px-2 py-1 font-mono text-xs" onClick={() => { navigator.clipboard.writeText(k.api_key); toast.success("Copied"); }}>
                        {k.api_key.slice(0, 20)}… <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs ${k.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{k.status}</span></td>
                    <td className="text-right pr-4">
                      <Button size="sm" variant="ghost" onClick={async () => { try { await update({ data: { id: k.id, status: k.status === "active" ? "suspended" : "active" } }); reload(); } catch (e) { toast.error((e as Error).message); } }}>
                        {k.status === "active" ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("Delete?")) return; try { await del({ data: { id: k.id } }); toast.success("Deleted"); reload(); } catch (e) { toast.error((e as Error).message); } }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}