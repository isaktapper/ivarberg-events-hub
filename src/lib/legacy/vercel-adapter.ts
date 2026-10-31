/**
 * Kör de befintliga Vercel-funktionerna i legacy-api/ (skrivna för
 * @vercel/node: handler(req, res)) som Next.js route handlers, utan att
 * ändra deras kod. Landningssidorna, sitemapen och tipsformulärets API
 * fungerar därmed exakt som tidigare.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

type LegacyHandler = (req: VercelRequest, res: VercelResponse) => unknown;

type RouteContext = { params?: Promise<Record<string, string>> };

/**
 * @param paramName  Om satt: värdet från route-segmentet (t.ex. /api/landing/[period])
 *                   skickas in som req.query[paramName], som rewrites tidigare gjorde.
 */
export function adaptLegacyHandler(handler: LegacyHandler, paramName?: string) {
  return async (request: Request, context?: RouteContext): Promise<Response> => {
    process.env.TZ = "Europe/Stockholm";
    const url = new URL(request.url);

    const query: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      const existing = query[key];
      if (existing === undefined) query[key] = value;
      else query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    });

    if (paramName && context?.params) {
      const params = await context.params;
      if (params[paramName]) query[paramName] = params[paramName];
    }

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body: unknown = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const text = await request.text();
      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        body = text;
      }
    }

    const req = { method: request.method, url: url.pathname + url.search, query, headers, body } as unknown as VercelRequest;

    return new Promise<Response>((resolve, reject) => {
      let status = 200;
      const resHeaders = new Headers();
      let done = false;

      const finish = (payload: BodyInit | null) => {
        if (done) return;
        done = true;
        resolve(new Response(payload, { status, headers: resHeaders }));
      };

      const res = {
        status(code: number) {
          status = code;
          return res;
        },
        setHeader(name: string, value: string | number | readonly string[]) {
          resHeaders.set(name, Array.isArray(value) ? value.join(", ") : String(value));
          return res;
        },
        getHeader(name: string) {
          return resHeaders.get(name) ?? undefined;
        },
        send(payload: unknown) {
          if (payload !== null && typeof payload === "object" && !(payload instanceof Uint8Array)) {
            return res.json(payload);
          }
          finish(payload == null ? null : (payload as BodyInit));
          return res;
        },
        json(payload: unknown) {
          if (!resHeaders.has("Content-Type")) resHeaders.set("Content-Type", "application/json; charset=utf-8");
          finish(JSON.stringify(payload));
          return res;
        },
        end(payload?: unknown) {
          finish(payload == null ? null : (payload as BodyInit));
          return res;
        },
        redirect(codeOrUrl: number | string, maybeUrl?: string) {
          const [code, location] = typeof codeOrUrl === "number" ? [codeOrUrl, maybeUrl!] : [302, codeOrUrl];
          status = code;
          resHeaders.set("Location", location);
          finish(null);
          return res;
        },
      } as unknown as VercelResponse & { json: (p: unknown) => unknown };

      Promise.resolve(handler(req, res))
        .then(() => {
          if (!done) finish(null);
        })
        .catch(reject);
    });
  };
}
