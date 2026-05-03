import { createMiddleware, createStart } from "@tanstack/react-start";

const SENSITIVE_QUERY_KEYS = ["api_key", "apikey", "key", "token", "secret", "password", "auth", "signature"];

function makeRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

function redactUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    for (const key of Array.from(url.searchParams.keys())) {
      const normalized = key.toLowerCase();
      if (SENSITIVE_QUERY_KEYS.some((sensitive) => normalized.includes(sensitive))) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "[invalid-url]";
  }
}

function serializeError(error: unknown) {
  if (error instanceof Response) {
    return {
      type: "Response",
      status: error.status,
      statusText: error.statusText,
    };
  }

  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error
        ? { type: error.cause.name, message: error.cause.message, stack: error.cause.stack }
        : error.cause,
    };
  }

  return { type: typeof error, value: String(error) };
}

function classifyRoute(pathname: string): string {
  if (pathname.startsWith("/_serverFn/")) return `serverFn:${pathname.replace("/_serverFn/", "")}`;
  if (pathname.startsWith("/api/public/")) return `public-api:${pathname}`;
  if (pathname.startsWith("/api/")) return `api:${pathname}`;
  if (pathname.startsWith("/_build/") || pathname.startsWith("/assets/")) return `asset:${pathname}`;
  return `page:${pathname}`;
}

const requestLogger = createMiddleware().server(async ({ next, request }) => {
  const requestId = makeRequestId();
  const startedAt = Date.now();
  const url = redactUrl(request.url);
  const host = request.headers.get("host") ?? null;
  const method = request.method;
  let pathname = "[unknown]";
  try { pathname = new URL(request.url).pathname; } catch { /* ignore */ }
  const routeName = classifyRoute(pathname);

  console.info("[server-request:start]", {
    requestId,
    method,
    route: routeName,
    url,
    host,
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    cfRay: request.headers.get("cf-ray"),
  });

  try {
    const result = await next();
    console.info("[server-request:end]", {
      requestId,
      method,
      route: routeName,
      url,
      host,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    console.error("[server-request:error] ❌ FAILED", {
      requestId,
      method,
      route: routeName,
      url,
      host,
      middlewareStack: ["requestLogger"],
      durationMs: Date.now() - startedAt,
      error: serializeError(error),
      hint: pathname.startsWith("/_serverFn/")
        ? "Failure inside a createServerFn handler — check the named function's .handler()."
        : pathname.startsWith("/api/")
          ? "Failure inside a server route handler at this path."
          : "Failure during SSR render of this page route.",
    });
    throw error;
  }
});

const functionErrorLogger = createMiddleware({ type: "function" }).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error("[server-fn:error] ❌ FAILED", {
      error: serializeError(error),
      hint: "Error originated inside a createServerFn handler. Combine with the [server-request:error] requestId logged for the same request to pinpoint the route.",
    });
    throw error;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLogger],
  functionMiddleware: [functionErrorLogger],
}));