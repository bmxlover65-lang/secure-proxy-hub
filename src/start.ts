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

const requestLogger = createMiddleware().server(async ({ next, request }) => {
  const requestId = makeRequestId();
  const startedAt = Date.now();
  const url = redactUrl(request.url);
  const host = request.headers.get("host") ?? null;
  const method = request.method;

  console.info("[server-request:start]", {
    requestId,
    method,
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
      url,
      host,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    console.error("[server-request:error]", {
      requestId,
      method,
      url,
      host,
      durationMs: Date.now() - startedAt,
      error: serializeError(error),
    });
    throw error;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLogger],
}));