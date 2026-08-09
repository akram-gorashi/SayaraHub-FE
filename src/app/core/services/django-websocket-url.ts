export function djangoWebSocketUrl(path: string, parameters: Record<string, string | number>): string {
  const location = globalThis.location;
  const developmentHost = location?.port === '4200' ? 'localhost:8000' : location?.host;
  const protocol = location?.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = new URL(path, `${protocol}//${developmentHost || 'localhost:8000'}`);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}
