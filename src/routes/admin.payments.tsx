import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListPaymentOrders } from "@/lib/payments.functions";
import { useCachedData } from "@/lib/use-cached";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

type Order = Awaited<ReturnType<typeof adminListPaymentOrders>>["orders"][number];

function AdminPayments() {
  const fetchOrders = useServerFn(adminListPaymentOrders);
  const [filter, setFilter] = useState<"all" | "pending" | "success" | "failed">("all");
  const { data, isFetching: loading, refetch: reload } = useCachedData<
    Awaited<ReturnType<typeof adminListPaymentOrders>>
  >("admin:payment-orders", () => fetchOrders(), { staleTime: 15_000 });
  const orders: Order[] = data?.orders ?? [];

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const sums = (s: string) => {
    const list = orders.filter((o) => o.status === s);
    return { count: list.length, total: list.reduce((a, o) => a + Number(o.amount_inr), 0) };
  };
  const pen = sums("pending"), suc = sums("success"), fai = sums("failed");

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        title="Wallet Top-up Payments"
        description="All BondPay top-up orders across users — credit status, signature checks and callback errors."
        actions={<Button size="sm" variant="outline" onClick={reload} disabled={loading}><RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {([
          { label: "Pending", s: pen, cls: "text-foreground" },
          { label: "Success", s: suc, cls: "text-success" },
          { label: "Failed", s: fai, cls: "text-destructive" },
        ] as const).map((c) => (
          <Card key={c.label} className="border-border/60" style={{ background: "var(--gradient-card)" }}>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <div className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.s.count}</div>
              <div className="text-xs text-muted-foreground">₹{c.s.total.toFixed(2)} total</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/40 p-4">
            <div className="font-semibold">All orders ({filtered.length})</div>
            <select
              className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No orders.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="p-3">Created</th><th>User</th><th>Order</th><th>Coins</th><th>Amount</th>
                    <th>Status</th><th>Signature</th><th>Callback</th><th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-b border-border/30 align-top">
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="text-xs">
                        <div className="font-medium">{o.full_name ?? o.email ?? o.user_id.slice(0, 8)}</div>
                        <div className="text-muted-foreground">{o.email}</div>
                      </td>
                      <td className="font-mono text-[11px]">
                        <div>{o.merchant_order_no}</div>
                        {o.gateway_order_no && <div className="text-muted-foreground">gw: {o.gateway_order_no}</div>}
                      </td>
                      <td className="font-mono">{Number(o.coins).toLocaleString()}</td>
                      <td className="font-mono">₹{Number(o.amount_inr).toFixed(2)} <span className="text-[10px] text-muted-foreground">{o.currency}</span></td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                          o.status === "success" ? "bg-success/15 text-success"
                          : o.status === "failed" ? "bg-destructive/15 text-destructive"
                          : "bg-secondary/60"
                        }`}>{o.status}</span>
                        {o.credited_at && <div className="mt-1 text-[10px] text-muted-foreground">credited {new Date(o.credited_at).toLocaleTimeString()}</div>}
                      </td>
                      <td>
                        {o.signature_status ? (
                          <span className={`rounded px-1.5 py-0.5 text-[11px] ${
                            o.signature_status === "valid" ? "bg-success/15 text-success"
                            : o.signature_status === "duplicate_ack" ? "bg-secondary/60"
                            : "bg-destructive/15 text-destructive"
                          }`}>{o.signature_status}</span>
                        ) : <span className="text-[11px] text-muted-foreground">—</span>}
                      </td>
                      <td className="text-[11px] text-muted-foreground">{o.callback_received_at ? new Date(o.callback_received_at).toLocaleString() : "—"}</td>
                      <td className="text-[11px] text-destructive max-w-[220px]">{o.callback_error ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
