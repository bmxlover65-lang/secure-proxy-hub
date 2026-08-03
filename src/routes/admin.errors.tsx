import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ErrorLogPanel } from "@/components/ErrorLogPanel";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/errors")({
  component: AdminErrorsPage,
  head: () => ({
    meta: [
      { title: "Error Log — Hyper Softs SaaS Admin" },
      { name: "description", content: "Every failed wallet callback, token attempt and data API request with status code, signature check and raw payloads for debugging." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Error Log — Hyper Softs SaaS" },
      { property: "og:description", content: "Unified failure feed across callbacks, tokens and data API requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AdminErrorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={AlertTriangle}
        title="Error Log"
        description="Saare failed callbacks, token attempts aur data API requests — status code, signature status aur raw request/response payload ke saath."
      />
      <ErrorLogPanel />
    </div>
  );
}
