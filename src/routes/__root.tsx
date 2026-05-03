import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

// Build version stamp — changes on every deploy, forces fresh HTML fetches
const BUILD_VERSION = (typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : String(Date.now()));
declare const __BUILD_VERSION__: string;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Cache-busting: prevent browsers from serving a stale HTML document that
      // references old (deleted) hashed JS/CSS bundles after a new deployment.
      { httpEquiv: "Cache-Control", content: "no-cache, no-store, must-revalidate" },
      { httpEquiv: "Pragma", content: "no-cache" },
      { httpEquiv: "Expires", content: "0" },
      { name: "build-version", content: BUILD_VERSION },
      { title: "Hyper Softs SaaS — Lottery API Reseller Platform" },
      { name: "description", content: "Premium API proxy for SASS lottery game resellers. IP whitelist, rate limiting, wallet billing & live request logs — all in one secure dashboard." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Hyper Softs SaaS — Lottery API Reseller Platform" },
      { property: "og:description", content: "Premium API proxy for SASS lottery game resellers. IP whitelist, rate limiting, wallet billing & live request logs — all in one secure dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Hyper Softs SaaS — Lottery API Reseller Platform" },
      { name: "twitter:description", content: "Premium API proxy for SASS lottery game resellers. IP whitelist, rate limiting, wallet billing & live request logs — all in one secure dashboard." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b5210cfe-fffe-40d9-96da-eb1d59aef991" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b5210cfe-fffe-40d9-96da-eb1d59aef991" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
