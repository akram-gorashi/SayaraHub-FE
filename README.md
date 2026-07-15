# SayaraHub Frontend

Angular 22 standalone application for browsing vehicles, managing seller listings, messaging, account settings, notifications, and administration.

## Technology

- Angular 22 with standalone components, lazy routes, signals, and `OnPush` change detection
- Strict TypeScript and Angular template checking
- SignalR for chat, user notifications, and live moderation alerts
- Vitest for unit tests
- Nginx production image with SPA fallback and WebSocket proxying

## Requirements

- Node.js 24 or newer
- npm 11
- SayaraHub API running at `http://localhost:8080`

## Local development

```powershell
npm install
npm start
```

Open `http://localhost:4200`. The development server uses [proxy.conf.json](proxy.conf.json) for `/api`, `/uploads`, and SignalR hub traffic, so API URLs stay same-origin.

Useful commands:

```powershell
npm test -- --watch=false
npx ngc -p tsconfig.app.json --noEmit
npm run build -- --configuration production
npm audit
```

## Application structure

```text
src/app/
  core/       API contracts, guards, interceptors, layout, and singleton services
  features/   Lazy-loaded feature areas such as cars, account, auth, admin, and content
```

Feature state is kept close to its page in signal-based stores. Shared API models and services live under `core`; feature-specific presentation remains inside its feature folder.

## Main routes

- `/cars` and `/cars/:id` — public browsing and vehicle details
- `/account/*` — dashboard, listings, favorites, messages, settings, and notification history
- `/admin/moderation` — searchable, paginated moderation queue with filters, fullscreen images, history, and live pending-listing updates

Authenticated routes use guards and the HTTP interceptor attaches access tokens. Refresh tokens are handled by the backend session flow. Notification preferences can be managed per event type from `/account/notifications`.

## Performance

- Feature pages are route-lazy-loaded.
- Images added by Angular templates use lazy loading where appropriate.
- Only Bootstrap's runtime bundle is global. jQuery and Owl Carousel are loaded on demand by the home route; other legacy plugins are excluded from the initial bundle.
- Production budgets are 600 kB warning and 800 kB error for the initial bundle.
- Hashed production assets receive long-lived immutable caching from Nginx.

## Production container

Build directly:

```powershell
docker build -t sayarahub-frontend .
docker run --rm -p 8081:8080 sayarahub-frontend
```

The Nginx configuration provides:

- SPA fallback to `index.html` for deep-link refreshes
- `/healthz` health check
- reverse proxying for API, uploads, health endpoints, and WebSocket hubs

For the complete HTTPS deployment, use the root backend Compose production overlay and follow its `deploy/PRODUCTION.md` guide.

## Dependency security

`package.json` pins patched compatible transitive versions of Babel and esbuild. Run `npm audit` after dependency changes and avoid force-fixing advisories that require an Angular major downgrade or upgrade without a full regression test.
