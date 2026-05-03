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

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/public/version") {
      return json({ version: BUILD_VERSION, ok: true });
    }

    try {
      const response = await defaultServerEntry.fetch(request);
      return withRuntimeHeaders(response);
    } catch (error) {
      console.error("[server-entry] request failed", error);
      return json({ status: 500, message: "Internal Server Error", version: BUILD_VERSION }, 500);
    }
  },
};