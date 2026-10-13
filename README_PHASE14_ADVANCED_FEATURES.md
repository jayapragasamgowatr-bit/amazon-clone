# Waventra Vetric – Advanced Feature Pack

This package adds the requested seven feature areas to the supplied server/client source:

1. Web Push Notifications
2. Customer Dashboard 2.0
3. Product Intelligence / Knowledge Graph
4. Semantic Product Search
5. AI Review Summarization
6. Fraud / Abnormal Order Detection integration (existing risk engine retained)
7. AI Admin Dashboard enhancements

## Important
The package intentionally does NOT include the server `.env` or client `.env.local` files from the uploaded source, so existing credentials are not overwritten.

## Server setup

```powershell
cd D:\Waventravetric\server
npm install
```

For Web Push, generate VAPID keys after npm install:

```powershell
npx web-push generate-vapid-keys
```

Put the generated values in the server `.env`:

```env
VAPID_SUBJECT=mailto:admin@yourdomain.com
VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

Put the same public key in the client `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

Restart both servers after changing environment variables.

## New customer pages

- `/dashboard` – Customer Dashboard 2.0
- `/notifications` – Enable/disable Web Push
- `/semantic-search` – Semantic product search

## New admin pages

- `/admin/advanced-ai` – AI Admin Dashboard enhancements
- `/admin/knowledge-graph` – Product Intelligence / Knowledge Graph
- `/admin/review-summaries` – AI Review Summarization

## Existing fraud detection
The existing rule-based risk/fraud signal engine is preserved at:

- `/admin/risk`
- `GET /api/risk/admin/analysis`
- `GET /api/risk/admin/customer`

This remains a risk-signal system, not a definitive fraud determination.

## New API routes

- `GET /api/advanced/dashboard`
- `POST /api/advanced/push/subscribe`
- `POST /api/advanced/push/unsubscribe`
- `GET /api/advanced/semantic-search?q=...`
- `GET /api/advanced/admin/knowledge-graph`
- `GET /api/advanced/admin/review-summary/:id`
- `GET /api/advanced/admin/advanced-ai`

## Shipping integration
The existing shipping management system remains intact. Shipping updates now also attempt a Web Push notification when VAPID is configured.

## Existing working features preserved

The package is based on the uploaded current source and preserves the existing:
- COD/order system
- price alerts
- wishlist
- recommendations
- AI search intelligence
- shipping management
- order status/cancellation/delete fixes
- existing admin intelligence/risk features
