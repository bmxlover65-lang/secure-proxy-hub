import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({ meta: [
    { title: "Terms of Service — Hyper Softs SaaS" },
    { name: "description", content: "Terms of Service for Hyper Softs SaaS." },
  ] }),
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
      <h1 className="mt-4 text-4xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 2 May 2026</p>
      <div className="prose prose-invert mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>By using Hyper Softs SaaS you agree to these terms.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Wallet & coins</h2>
        <p>Coins are credited only on successful payment. Coins consumed for issued API keys are non-refundable.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Acceptable use</h2>
        <p>No abuse, brute force, or illegal activity through the proxy. Keys may be suspended for violations.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Liability</h2>
        <p>Service is provided &quot;as is&quot;. We are not liable for upstream provider downtime.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Contact</h2>
        <p>support@hyperapi.in</p>
      </div>
    </div>
  );
}