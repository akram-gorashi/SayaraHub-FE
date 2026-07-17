interface Env {
  API_ORIGIN?: string;
}

interface CloudflareContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

const proxiedPath = /^\/(api|uploads|hubs|health)(\/|$)/;

export const onRequest = async (
  context: CloudflareContext
): Promise<Response> => {
  const requestUrl = new URL(context.request.url);

  if (!proxiedPath.test(requestUrl.pathname)) {
    return context.next();
  }

  const apiOrigin =
    context.env.API_ORIGIN ??
    'https://sayarahub-api-thv0.onrender.com';

  const targetUrl = new URL(
    requestUrl.pathname + requestUrl.search,
    apiOrigin
  );

  const method = context.request.method;

  const proxyRequest = new Request(targetUrl, {
    method,
    headers: context.request.headers,
    body:
      method === 'GET' || method === 'HEAD'
        ? undefined
        : context.request.body,
    redirect: 'manual'
  });

  return fetch(proxyRequest);
};