import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateReseller,
  adminUpdateReseller,
  adminDeleteReseller,
  adminRegenerateKey,
  adminSetIps,
} from "@/server/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Copy, Network } from "lucide-react";

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
    (ips ?? []).forEach((r: any) => {
      (map[r.reseller_id] ??= []).push(r.ip_address);
    });
    setIpMap(map);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Resellers</h1>
          <p className="text-sm text-muted-foreground">Create and manage API keys.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New reseller</Button></DialogTrigger>
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
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border">
        <CardHeader><CardTitle>All resellers ({list.length})</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resellers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Name</th><th>API Key</th><th>IPs</th><th>Rate</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-3 font-medium">{r.name}</td>
                      <td>
                        <button className="flex items-center gap-1 font-mono text-xs hover:text-primary" onClick={() => copy(r.api_key)}>
                          {r.api_key.slice(0, 16)}… <Copy className="h-3 w-3" />
                        </button>
                      </td>
                      <td className="text-xs text-muted-foreground">{(ipMap[r.id] ?? []).length || "Any"}</td>
                      <td className="text-xs">{r.rate_limit_per_minute}/min</td>
                      <td>
                        <Badge variant={r.status === "active" ? "default" : "destructive"}>{r.status}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setIpDialog(r); setIpText((ipMap[r.id] ?? []).join("\n")); }}>
                            <Network className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            const next = r.status === "active" ? "suspended" : "active";
                            try { await update({ data: { id: r.id, status: next } }); toast.success(`Set to ${next}`); load(); }
                            catch (e) { toast.error((e as Error).message); }
                          }}>
                            {r.status === "active" ? "Suspend" : "Activate"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try { const { api_key } = await regen({ data: { id: r.id } }); copy(api_key); toast.success("Key regenerated & copied"); load(); }
                            catch (e) { toast.error((e as Error).message); }
                          }}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            if (!confirm(`Delete ${r.name}?`)) return;
                            try { await del({ data: { id: r.id } }); toast.success("Deleted"); load(); }
                            catch (e) { toast.error((e as Error).message); }
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!ipDialog} onOpenChange={(o) => !o && setIpDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allowed IPs — {ipDialog?.name}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">One IP per line. Leave empty to allow any IP (not recommended).</p>
          <Textarea rows={8} value={ipText} onChange={(e) => setIpText(e.target.value)} placeholder="203.0.113.10&#10;198.51.100.5" className="font-mono text-sm" />
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
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Create reseller</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Rate limit (per minute)</Label><Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Allowed IPs (one per line)</Label><Textarea rows={4} value={ips} onChange={(e) => setIps(e.target.value)} placeholder="203.0.113.10" className="font-mono text-sm" /></div>
        <div className="space-y-2"><Label>Notes (optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onCreate({
          name, rate_limit_per_minute: rate,
          allowed_ips: ips.split(/\s|,/).map((s) => s.trim()).filter(Boolean),
          notes: notes || undefined,
        })}>Create</Button>
      </DialogFooter>
    </DialogContent>
  );
}