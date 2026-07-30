import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListTransactions } from "@/lib/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/admin/transactions")({ component: AdminTx });

function AdminTx() {
  const fetchTx = useServerFn(adminListTransactions);
  const [txs, setTxs] = useState<Awaited<ReturnType<typeof adminListTransactions>>["transactions"]>([]);
  useEffect(() => { fetchTx().then((r) => setTxs(r.transactions)).catch(() => {}); }, [fetchTx]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Receipt} title="Transactions" description="Last 200 coin transactions across all users." />
      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/40"><th className="p-3">Time</th><th>User</th><th>Type</th><th>Reason</th><th>Reference</th><th>Status</th><th className="text-right pr-3">Amount</th></tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const amt = Number(t.amount);
                  return (
                    <tr key={t.id} className="border-b border-border/30">
                      <td className="p-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="text-xs">{t.user?.email ?? t.user_id.slice(0, 8)}</td>
                      <td><span className="rounded bg-secondary/40 px-2 py-0.5 text-[11px]">{t.type}</span></td>
                      <td className="text-xs">{t.reason}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{t.reference || "—"}</td>
                      <td><span className={`rounded-full px-2 py-0.5 text-[11px] ${t.status === "success" ? "bg-success/15 text-success" : "bg-secondary/40"}`}>{t.status}</span></td>
                      <td className={`text-right pr-3 font-mono font-semibold ${amt >= 0 ? "text-success" : "text-destructive"}`}>{amt >= 0 ? "+" : ""}{amt.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}