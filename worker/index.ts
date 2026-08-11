interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  API_ORIGIN?: string;
  ASSETS: AssetBinding;
}

const proxiedPath = /^\/(api|uploads|hubs|health)(\/|$)/;
const defaultApiOrigin = 'https://sayarahub-api-thv0.onrender.com';
const contentSecurityPolicy = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
  "form-action 'self'", "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com", "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  'upgrade-insecure-requests'
].join('; ');

function secure(response: Response, requestUrl: URL): Response {
  // A WebSocket upgrade carries a runtime-specific socket on the original
  // response and must not be reconstructed.
  if (response.status === 101) return response;
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', contentSecurityPolicy);
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=()');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (requestUrl.protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);
    if (!proxiedPath.test(requestUrl.pathname)) {
      return secure(await env.ASSETS.fetch(request), requestUrl);
    }

    const apiOrigin = new URL(env.API_ORIGIN ?? defaultApiOrigin);
    const targetUrl = new URL(requestUrl.pathname + requestUrl.search, apiOrigin);
    const headers = new Headers(request.headers);
    headers.delete('host');

    const response = await fetch(
      new Request(targetUrl, {
        method: request.method,
        headers,
        body:
          request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : request.body,
        redirect: 'manual'
      })
    );
    return secure(response, requestUrl);
  }
};
