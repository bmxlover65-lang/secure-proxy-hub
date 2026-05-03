import defaultServerEntry from "@tanstack/react-start/server-entry";

declare const __BUILD_VERSION__: string;

const BUILD_VERSION = typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : "dev";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "X-Build-Version": BUILD_VERSION,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...noStoreHeaders,
    },
  });
}

function withRuntimeHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("X-Build-Version", BUILD_VERSION);

  const contentType = headers.get("Content-Type") || "";
  if (contentType.includes("text/html")) {
    for (const [key, value] of Object.entries(noStoreHeaders)) {
      headers.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isHtmlRoute(request: Request, pathname: string) {
  if (!['GET', 'HEAD'].includes(request.method)) return false;
  if (pathname.startsWith('/api/') || pathname.startsWith('/~') || pathname.includes('.')) return false;
  const accept = request.headers.get('accept') || '*/*';
  return accept.includes('text/html') || accept.includes('*/*');
}

function appFallback(pathname = "/") {
  const title = pathname === "/login" ? "Sign in" : "Hyper Softs";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Hyper Softs</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#020617;color:#e5e7eb;font-family:Inter,system-ui,sans-serif"><main style="text-align:center;padding:24px"><h1 style="margin:0 0 8px;font-size:28px">Hyper Softs</h1><p style="margin:0;color:#94a3b8">The app is loading a fresh version. Please refresh once.</p><p style="margin:14px 0 0;display:flex;gap:14px;justify-content:center"><a href="/" style="color:#93c5fd;text-decoration:none">Home</a><a href="/login" style="color:#93c5fd;text-decoration:none">Login</a></p></main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...noStoreHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === "/api/public/version") {
      return json({ version: BUILD_VERSION, ok: true });
    }

    try {
      const handler = defaultServerEntry.fetch as unknown as (this: typeof defaultServerEntry, ...args: unknown[]) => Promise<Response>;
      const response = await handler.call(defaultServerEntry, request, env, ctx);
      if (response.status >= 500 && isHtmlRoute(request, url.pathname)) {
        return appFallback(url.pathname);
      }
      return withRuntimeHeaders(response);
    } catch (error) {
      console.error("[server-entry] request failed", error);
      if (isHtmlRoute(request, url.pathname)) {
        return appFallback(url.pathname);
      }
      return json({ status: 500, message: "Internal Server Error", version: BUILD_VERSION }, 500);
    }
  },
};