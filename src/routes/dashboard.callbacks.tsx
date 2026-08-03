import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { CallbackPanel } from "@/components/CallbackPanel";
import { Webhook } from "lucide-react";

export const Route = createFileRoute("/dashboard/callbacks")({
  component: ResellerCallbacksPage,
  head: () => ({
    meta: [
      { title: "Token & Callback Integration — Hyper Softs SaaS" },
      { name: "description", content: "Configure your callback URL, HMAC secret and token lifetime, then watch GetBalance, PlaceBet and WinLoss callbacks in real time." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Token & Callback Integration — Hyper Softs SaaS" },
      { property: "og:description", content: "Seamless wallet integration: per-key callback URL, signed requests, single-use tokens and full logs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResellerCallbacksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Webhook}
        title="Token / Callback Mode"
        description="Set your callback URL + HMAC secret per key. Tokens are single-use and expire automatically."
      />
      <CallbackPanel scope="reseller" />
    </div>
  );
}