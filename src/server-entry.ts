import defaultServerEntry from "@tanstack/react-start/server-entry";

declare const __BUILD_VERSION__: string;
const BUILD_VERSION = typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : "dev";

function reqId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause ? String(err.cause) : undefined,
    };
  }
  try {
    return { value: JSON.parse(JSON.stringify(err)) };
  } catch {
    return { value: String(err) };
  }
}

export default {
  async fetch(request: Request, env?: unknown, ctx?: unknown) {
    const id = reqId();
    const url = new URL(request.url);

    if (url.pathname === "/api/public/version") {
      return new Response(
        JSON.stringify({ version: BUILD_VERSION, ok: true, requestId: id }),
        { status: 200, headers: { "Content-Type": "application/json", "X-Request-Id": id, "X-Build-Version": BUILD_VERSION, "Cache-Control": "no-store" } },
      );
    }

    console.log(`[req ${id}] ${request.method} ${url.pathname}${url.search}`);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: Response = await (defaultServerEntry as any).fetch(request, env, ctx);
      const headers = new Headers(response.headers);
      headers.set("X-Request-Id", id);
      headers.set("X-Build-Version", BUILD_VERSION);
      if (response.status >= 500) {
        const cloned = response.clone();
        let body = "";
        try { body = await cloned.text(); } catch { /* ignore */ }
        console.error(`[req ${id}] upstream ${response.status}`, body.slice(0, 2000));
      }
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (error) {
      const info = serializeError(error);
      console.error(`[req ${id}] UNCAUGHT`, JSON.stringify(info));
      return new Response(
        JSON.stringify({
          status: 500,
          requestId: id,
          version: BUILD_VERSION,
          path: url.pathname,
          error: info,
        }, null, 2),
        { status: 500, headers: { "Content-Type": "application/json", "X-Request-Id": id, "X-Build-Version": BUILD_VERSION } },
      );
    }
  },
};
