# Waventra Vetric — Phase 15 Production Hardening

This package is based on the latest working client/server supplied for Phase 14.
It focuses on production safety and reliability without removing the existing Phase 14 features.

## Included hardening

### Server
- Explicit CORS origins; wildcard CORS remains blocked.
- Security headers and request IDs.
- API responses marked `no-store`.
- Production proxy awareness for correct client IP rate limiting.
- Bounded in-process rate limiter with `Retry-After`.
- Strict production environment validation.
- JWT secret minimum length validation.
- VAPID configuration consistency validation.
- MongoDB connection timeout and pool-size controls.
- Graceful shutdown.
- Production-safe error messages.
- Stronger password reset requirements (8+ characters, letter + number).
- Order schema aligned with the existing order controller: stock flags, status history, cancellation fields, shipping data and shipment updates.
- Additional order indexes for user/status/tracking lookups.
- Production configuration checker and JavaScript syntax checker.

### Client
- Existing security headers retained.
- Production browser source maps explicitly disabled.
- API cache disabled for Next API paths.
- Production warning when `NEXT_PUBLIC_API_URL` accidentally points to localhost.
- Public VAPID key documented; private VAPID key is never part of the client package.

## IMPORTANT: secrets

This release ZIP intentionally does NOT include the existing `.env` or `.env.local` files.
Keep your working secrets outside the source package.

Copy the appropriate example file and enter your real values:

- Server: `.env.example` -> `.env`
- Client: `.env.local.example` -> `.env.local` for local development
- Client production: configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in the deployment environment.

Never place `VAPID_PRIVATE_KEY`, `JWT_SECRET`, `MONGO_URI`, `GEMINI_API_KEY`, Cloudinary secrets or email API keys in the client.

## Local setup

### Server
```powershell
cd D:\Waventravetric\server
npm install
npm run check:production
npm run check:syntax
npm test
npm start
```

For local development, `check:production` can be run after your `.env` is populated; it validates required configuration but does not print secrets.

### Client
```powershell
cd D:\Waventravetric\client
npm install
npm run build
npm start
```

For development:
```powershell
npm run dev
```

## Production checklist

- [ ] Use HTTPS for frontend and API.
- [ ] Set `NODE_ENV=production` on the server.
- [ ] Set explicit `CLIENT_URL` to the frontend origin(s), comma-separated if needed.
- [ ] Use a new random 32+ character `JWT_SECRET`.
- [ ] Keep MongoDB credentials server-side only.
- [ ] Keep VAPID private key server-side only.
- [ ] Configure Cloudinary credentials server-side only.
- [ ] Configure AI credentials server-side only.
- [ ] Configure email credentials/API keys server-side only.
- [ ] Set the production client `NEXT_PUBLIC_API_URL` to the live API.
- [ ] Run the server tests after `npm install`.
- [ ] Run the client production build.
- [ ] Test login/logout and expired-token handling.
- [ ] Test customer order creation and COD.
- [ ] Test stock reservation and cancellation.
- [ ] Test Delivered -> Cancelled without accidental stock restoration.
- [ ] Test admin status changes and delete authorization.
- [ ] Test shipping management and customer shipping notifications.
- [ ] Test price alerts and Web Push.
- [ ] Test admin AI pages and semantic search.
- [ ] Verify no secrets are committed to Git.

## Rollback

Keep the previous working client/server folders as a backup before replacement. If a deployment fails, restore the previous build and environment values, then investigate the failing checklist item before retrying.
