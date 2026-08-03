import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ErrorLogPanel } from "@/components/ErrorLogPanel";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/dashboard/errors")({
  component: ResellerErrorsPage,
  head: () => ({
    meta: [
      { title: "My Error Log — Hyper Softs SaaS" },
      { name: "description", content: "Debug your own failed API requests and wallet callbacks: status codes, signature checks, whitelist rejections and raw payloads." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "My Error Log — Hyper Softs SaaS" },
      { property: "og:description", content: "Failure feed for your API keys and callback integration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResellerErrorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={AlertTriangle}
        title="Error Log"
        description="Aapke keys ke saare failed requests aur callbacks — payload ke saath, taaki exact reason turant dikhe."
      />
      <ErrorLogPanel />
    </div>
  );
}
