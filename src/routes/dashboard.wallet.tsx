import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/server/reseller.functions";
import { createTopupOrder, listMyOrders } from "@/server/payments.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Coins, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

function WalletPage() {
  const fetchOverview = useServerFn(getMyOverview);
  const createOrder = useServerFn(createTopupOrder);
  const fetchOrders = useServerFn(listMyOrders);
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyOverview>> | null>(null);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof listMyOrders>>["orders"]>([]);
  const [coins, setCoins] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "failed">("all");

  const reload = useCallback(() => {
    fetchOverview().then(setData).catch(() => {});
    fetchOrders().then((r) => setOrders(r.orders)).catch(() => {});
  }, [fetchOverview, fetchOrders]);
  useEffect(() => { reload(); }, [reload]);

  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const paise = Number(data?.settings.paise_per_1000_coins ?? 2000);
  const inrPer1000 = paise / 100;
  const inrAmount = (coins / 1000) * inrPer1000;
  const filteredOrders = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const startTopup = async () => {
    if (coins < 1000) return toast.error("Minimum 1000 coins");
    setLoading(true);
    try {
      const res = await createOrder({ data: { coins } });
      toast.success("Redirecting to payment…");
      window.open(res.payment_url, "_blank");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title="Wallet" description="Your coin balance and top-up options." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
          <CardContent className="p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Current balance</div>
            <div className="mt-2 flex items-baseline gap-2">
              <Coins className="h-6 w-6 text-primary" />
              <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">coins</span>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">≈ ₹{((balance / 1000) * inrPer1000).toFixed(2)} value</div>
          </CardContent>
        </Card>
        <Card className="border-border/60" style={{ background: "var(--gradient-card)" }}>
          <CardContent className="p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Top up via BondPay</div>
            <p className="mt-2 text-sm text-muted-foreground">Rate: <strong>1000 coins = ₹{inrPer1000}</strong></p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Coins</Label>
                <Input type="number" min={1000} step={1000} value={coins} onChange={(e) => setCoins(Math.max(1000, parseInt(e.target.value || "1000", 10)))} />
              </div>
              <div>
                <Label className="text-xs">Amount (INR)</Label>
                <Input value={`₹${inrAmount.toFixed(2)}`} readOnly />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1000, 5000, 10000, 25000, 50000].map(c => (
                <Button key={c} type="button" size="sm" variant="outline" onClick={() => setCoins(c)}>{c.toLocaleString()}</Button>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={startTopup} disabled={loading}>
              {loading ? "Creating order…" : <>Pay ₹{inrAmount.toFixed(2)} <ExternalLink className="ml-1.5 h-4 w-4" /></>}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">After successful payment, your wallet is credited automatically.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["pending", "success", "failed"] as const).map((s) => {
          const list = orders.filter((o) => o.status === s);
          const sum = list.reduce((a, o) => a + Number(o.amount_inr), 0);
          const cls = s === "success" ? "text-success" : s === "failed" ? "text-destructive" : "text-foreground";
          return (
            <Card key={s} className="border-border/60" style={{ background: "var(--gradient-card)" }}>
              <CardContent className="p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s}</div>
                <div className={`mt-1 text-2xl font-bold ${cls}`}>{list.length}</div>
                <div className="text-xs text-muted-foreground">₹{sum.toFixed(2)} total</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/40 p-4">
            <div>
              <div className="font-semibold">Top-up orders</div>
              <div className="text-xs text-muted-foreground">Pending, success and failed payments</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
              <Button size="sm" variant="ghost" onClick={reload}><RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh</Button>
            </div>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No orders yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/40"><th className="p-3">Order</th><th>Coins</th><th>Amount</th><th>Status</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/30">
                    <td className="p-3 font-mono text-xs">{o.merchant_order_no}</td>
                    <td>{Number(o.coins).toLocaleString()}</td>
                    <td>₹{Number(o.amount_inr).toFixed(2)}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                        o.status === "success" ? "bg-success/15 text-success"
                        : o.status === "failed" ? "bg-destructive/15 text-destructive"
                        : "bg-secondary/60 text-foreground"
                      }`}>{o.status}</span>
                    </td>
                    <td className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="text-right pr-3">
                      {o.status === "pending" && o.payment_url && (
                        <Button size="sm" variant="ghost" asChild><a href={o.payment_url} target="_blank" rel="noreferrer">Pay <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
                      )}
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