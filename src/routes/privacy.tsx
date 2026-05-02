import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({ meta: [
    { title: "Privacy Policy — Hyper Softs SaaS" },
    { name: "description", content: "Privacy Policy for Hyper Softs SaaS." },
  ] }),
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
      <h1 className="mt-4 text-4xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 2 May 2026</p>
      <div className="prose prose-invert mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Hyper Softs SaaS (&quot;we&quot;, &quot;us&quot;) operates this platform. This policy explains what data we collect and how it is used.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Information we collect</h2>
        <p>Account email, hashed authentication tokens, wallet balance, transaction history, API keys you create, and request logs from our API proxy.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">How we use it</h2>
        <p>To provide the service, bill coin-based usage, prevent abuse, and improve reliability.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Sharing</h2>
        <p>We do not sell personal data. Payments are processed through BondPay; payment status callbacks are received over HTTPS.</p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Contact</h2>
        <p>Questions: support@hyperapi.in</p>
      </div>
    </div>
  );
}