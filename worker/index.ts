interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  API_ORIGIN?: string;
  ASSETS: AssetBinding;
}

const proxiedPath = /^\/(api|uploads|hubs|health)(\/|$)/;
const defaultApiOrigin = 'https://sayarahub-api-thv0.onrender.com';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);
    if (!proxiedPath.test(requestUrl.pathname)) {
      return env.ASSETS.fetch(request);
    }

    const apiOrigin = new URL(env.API_ORIGIN ?? defaultApiOrigin);
    const targetUrl = new URL(requestUrl.pathname + requestUrl.search, apiOrigin);
    const headers = new Headers(request.headers);
    headers.delete('host');

    return fetch(
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
  }
};
