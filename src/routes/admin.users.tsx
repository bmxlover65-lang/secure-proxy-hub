import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminAdjustWallet, adminSetUserRole } from "@/server/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Coins, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const fetchUsers = useServerFn(adminListUsers);
  const adjust = useServerFn(adminAdjustWallet);
  const setRole = useServerFn(adminSetUserRole);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof adminListUsers>>["users"]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(1000);
  const [reason, setReason] = useState("");

  const reload = useCallback(() => { fetchUsers().then((r) => setUsers(r.users)).catch(() => {}); }, [fetchUsers]);
  useEffect(() => { reload(); }, [reload]);

  const submit = async (uid: string) => {
    try {
      await adjust({ data: { user_id: uid, amount, reason: reason || undefined } });
      toast.success("Wallet updated");
      setOpen(null); setAmount(1000); setReason(""); reload();
    } catch (e) { toast.error((e as Error).message); }
  };

  const toggleAdmin = async (uid: string, isAdmin: boolean) => {
    try {
      await setRole({ data: { user_id: uid, role: "admin", action: isAdmin ? "remove" : "add" } });
      toast.success(isAdmin ? "Admin role removed" : "Promoted to admin");
      reload();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Users" description="All registered users — manage wallets and roles." />
      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/40"><th className="p-3">User</th><th>Roles</th><th>Balance</th><th>Keys</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-b border-border/30">
                    <td className="p-3"><div className="font-medium">{u.full_name ?? u.email}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                    <td>
                      <div className="flex gap-1">
                        {u.roles.map((r) => (
                          <span key={r} className={`rounded-full px-2 py-0.5 text-[11px] ${r === "admin" ? "bg-primary/15 text-primary" : "bg-secondary/40"}`}>{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="font-mono">{Number(u.wallet_balance).toLocaleString()}</td>
                    <td>{u.client_count}</td>
                    <td className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="text-right pr-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toggleAdmin(u.id, isAdmin)} title={isAdmin ? "Demote" : "Promote to admin"}>
                          {isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                        <Dialog open={open === u.id} onOpenChange={(o) => setOpen(o ? u.id : null)}>
                          <DialogTrigger asChild><Button size="sm" variant="outline"><Coins className="mr-1 h-3.5 w-3.5" /> Adjust</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Adjust wallet — {u.email}</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <div><Label>Amount (negative to debit)</Label><Input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))} /></div>
                              <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Manual top-up" /></div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                              <Button onClick={() => submit(u.id)}>Apply</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}