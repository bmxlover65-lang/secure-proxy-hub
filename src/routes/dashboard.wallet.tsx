import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/server/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Coins } from "lucide-react";

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

function WalletPage() {
  const fetchOverview = useServerFn(getMyOverview);
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyOverview>> | null>(null);
  useEffect(() => { fetchOverview().then(setData).catch(() => {}); }, [fetchOverview]);
  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const paise = Number(data?.settings.paise_per_1000_coins ?? 2000);
  const inrPer1000 = paise / 100;

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
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Top up</div>
            <p className="mt-2 text-sm text-muted-foreground">Payment gateway integration coming soon. Rate: <strong>1000 coins = ₹{inrPer1000}</strong>.</p>
            <p className="mt-3 text-xs text-muted-foreground">Contact admin for manual top-up while we wire up your payment gateway.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}