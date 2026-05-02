import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListOrders } from "@/server/payments.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

type Order = Awaited<ReturnType<typeof adminListOrders>>["orders"][number];

function sigBadge(s: string | null | undefined) {
  const v = (s ?? "").toLowerCase();
  if (v === "verified") return <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success"><ShieldCheck className="h-3 w-3" />verified</span>;
  if (v === "failed" || v === "amount_mismatch" || v === "currency_mismatch")
    return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] text-destructive"><ShieldAlert className="h-3 w-3" />{v.replace("_", " ")}</span>;
  if (v === "missing") return <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-[11px]"><ShieldQuestion className="h-3 w-3" />no signature</span>;
  return <span className="rounded-full bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">—</span>;
}

function statusBadge(s: string) {
  const cls =
    s === "success" ? "bg-success/15 text-success"
    : s === "failed" ? "bg-destructive/15 text-destructive"
    : "bg-secondary/60 text-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] ${cls}`}>{s}</span>;
}

function AdminOrders() {
  const fetchOrders = useServerFn(adminListOrders);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "success" | "failed">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchOrders().then((r) => setOrders(r.orders)).catch(() => {});
  }, [fetchOrders]);
  useEffect(() => { reload(); }, [reload]);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const totals = {
    pending: orders.filter((o) => o.status === "pending").length,
    success: orders.filter((o) => o.status === "success").length,
    failed: orders.filter((o) => o.status === "failed").length,
    sumSuccess: orders.filter((o) => o.status === "success").reduce((a, o) => a + Number(o.amount_inr), 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title="Top-up Orders" description="All payment orders, callback results, and signature checks." />

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending</div>
          <div className="mt-1 text-2xl font-bold">{totals.pending}</div>
        </CardContent></Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Success</div>
          <div className="mt-1 text-2xl font-bold text-success">{totals.success}</div>
          <div className="text-xs text-muted-foreground">₹{totals.sumSuccess.toFixed(2)} credited</div>
        </CardContent></Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Failed</div>
          <div className="mt-1 text-2xl font-bold text-destructive">{totals.failed}</div>
        </CardContent></Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="mt-1 text-2xl font-bold">{orders.length}</div>
        </CardContent></Card>
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/40 p-4">
            <div className="font-semibold">Orders</div>
            <div className="flex items-center gap-2">
              <select className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
              <Button size="sm" variant="ghost" onClick={reload}><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/40">
                  <th className="p-3">Created</th><th>User</th><th>Order</th><th>Amount</th><th>Coins</th>
                  <th>Status</th><th>Signature</th><th>Callback</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No orders</td></tr>
                )}
                {filtered.map((o) => (
                  <>
                    <tr key={o.id} className="border-b border-border/30">
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="text-xs">{o.user?.email ?? o.user_id.slice(0, 8)}</td>
                      <td className="font-mono text-[11px]">{o.merchant_order_no}</td>
                      <td>₹{Number(o.amount_inr).toFixed(2)} <span className="text-[10px] text-muted-foreground">{o.currency || "INR"}</span></td>
                      <td>{Number(o.coins).toLocaleString()}</td>
                      <td>{statusBadge(o.status)}</td>
                      <td>{sigBadge(o.signature_status)}</td>
                      <td className="text-xs text-muted-foreground">
                        {o.callback_received_at ? new Date(o.callback_received_at).toLocaleString() : "—"}
                        {o.callback_error && <div className="text-destructive text-[11px]">{o.callback_error}</div>}
                      </td>
                      <td className="pr-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                          {expanded === o.id ? "Hide" : "Raw"}
                        </Button>
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr key={o.id + "-raw"} className="border-b border-border/30 bg-background/40">
                        <td colSpan={9} className="p-3">
                          <pre className="overflow-x-auto rounded bg-muted/30 p-3 text-[11px]">{JSON.stringify(o.raw_callback ?? { note: "no callback yet" }, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}