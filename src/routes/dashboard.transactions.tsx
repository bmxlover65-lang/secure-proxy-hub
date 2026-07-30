import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/lib/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/dashboard/transactions")({ component: TxPage });

function TxPage() {
  const fetchOverview = useServerFn(getMyOverview);
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyOverview>> | null>(null);
  useEffect(() => { fetchOverview().then(setData).catch(() => {}); }, [fetchOverview]);
  const txs = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader icon={Receipt} title="Transactions" description="Your coin activity history." />
      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          {txs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No transactions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/40"><th className="p-3">Date</th><th>Type</th><th>Reason</th><th>Reference</th><th className="text-right pr-3">Amount</th></tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const amt = Number(t.amount);
                  return (
                    <tr key={t.id} className="border-b border-border/30">
                      <td className="p-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                      <td><span className="rounded bg-secondary/40 px-2 py-0.5 text-[11px]">{t.type}</span></td>
                      <td>{t.reason}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{t.reference || "—"}</td>
                      <td className={`text-right pr-3 font-mono font-semibold ${amt >= 0 ? "text-success" : "text-destructive"}`}>
                        {amt >= 0 ? "+" : ""}{amt.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}