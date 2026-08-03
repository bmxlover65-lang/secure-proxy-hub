import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { CallbackPanel } from "@/components/CallbackPanel";
import { TokenFlowLogs } from "@/components/TokenFlowLogs";
import { Webhook } from "lucide-react";

export const Route = createFileRoute("/admin/callbacks")({
  component: AdminCallbacksPage,
  head: () => ({
    meta: [
      { title: "Callback & Token Logs — Hyper Softs SaaS Admin" },
      { name: "description", content: "Monitor GetBalance, PlaceBet and WinLoss callbacks, token issuance, signature checks and whitelist rejections across all API clients." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Callback & Token Logs — Hyper Softs SaaS" },
      { property: "og:description", content: "Admin view of every token and wallet callback handled by the Hyper Softs proxy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AdminCallbacksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Webhook}
        title="Callbacks & Tokens"
        description="Every GetBalance / PlaceBet / WinLoss callback, token issue and replay attempt — with signature and whitelist result."
      />
      <TokenFlowLogs />
      <CallbackPanel scope="admin" />
    </div>
  );
}