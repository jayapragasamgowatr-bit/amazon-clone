# Round 3 (wishlist layout, one background everywhere)

- Wishlist cards now match the product grid: fixed image area, equal card heights, buttons lined up along the bottom.
- 11 more pages (admin dashboard, orders, products, inventory, reviews, customers, analytics, catalogue intelligence,
  business intelligence, and the customer Orders page) no longer paint their own background, so every page shows the
  same background as the home page.

---

# Waventra Vetric: round 2 (roles, coupons, returns, Q&A, account, content, theme)

Extract `client/` and `server/` over `D:\Waventravetric` (keep a copy of the old folders first), then restart both terminals.
No new packages. One optional new server setting: `RETURN_WINDOW_DAYS` (default 7).

## Fill in your company details
Open `client/lib/siteConfig.js` and replace everything in [square brackets] (registered name, address, GSTIN, support email and
phone, dispatch / delivery / refund times, warranty). These appear on the About, FAQ, Shipping and Returns pages and on invoices.
Until you do, the placeholders are shown highlighted in yellow. The About, Shipping and Returns pages also each have one
highlighted paragraph for you to write.

## Staff roles and privileges
| Role | Can do |
|---|---|
| Support | Orders, shipping, customer lookup, returns, product questions |
| Inventory | Products, stock, product questions, order lookup |
| Manager | Everything except changing staff roles |
| Administrator | Everything |

- Assign roles and suspend / restore accounts at **Admin > Team & access**. Your existing admin account stays Administrator.
- Suspended accounts are signed out and cannot log in or order. The last administrator cannot be removed or suspended.
- **Admin > Activity log** records who changed products, stock, orders, returns, coupons, questions and accounts.
- A menu bar now appears on every admin page and shows only the sections that person's role can use.
- Deleting users and deleting orders stays Administrator-only.

## New store features
- **Coupons**: create at Admin > Coupons (percent or fixed, minimum order, cap, usage limits, dates). Customers apply them at
  checkout. The discount is recalculated on the server from live prices when the order is placed.
- **Returns**: customers request a return from a delivered order within the return window; staff approve, reject or mark
  refunded at Admin > Returns. Marking "refunded" only records it; send the money through your payment method.
- **Customer cancel**: customers can cancel their own order while it is Pending or Confirmed; stock and coupon use are restored.
- **Invoice**: "Invoice" on any order opens a print-ready page (Print / save as PDF).
- **Product Q&A**: customers ask on the product page; staff answer at Admin > Questions; answered questions show publicly.
- **My account** (`/account`): edit name, change password, saved delivery addresses (also selectable at checkout).

## Content and design
- New pages: About, FAQ, Shipping, Returns, with four original illustrations (`components/Illustrations.js`).
- 15 pages that painted their own flat background now show the same background as the home page.
- A shared set of styles (`ui-` classes in `styles/globals.css`) is used by every new page so spacing, buttons, tables and
  dialogs line up the same way.
- Decorative emoji removed from headings, buttons and messages; footer text rewritten; footer links to all new pages.

## New files
server: `models/{Coupon,AdminActivity,ProductQuestion}.js`, `controllers/{coupon,orderExtras,staff,account,question}Controller.js`,
`routes/{coupon,orderExtras,staff,account,question}Routes.js`, `utils/{permissions,couponRules,returnRules}.js`,
`middlewares/auditMiddleware.js`, `tests/{roles-coupons-returns,account-questions}.test.js`
client: `pages/admin/{coupons,returns,access,activity,questions}.js`, `pages/{account,about,faq,shipping-policy,returns-policy}.js`,
`pages/orders/invoice/[id].js`, `components/{AdminNav,OrderActions,ProductQuestions,CheckoutExtras,InfoPage,Illustrations}.js`,
`lib/{permissions,siteConfig}.js`

---

# Round 1 (AI features, fixes, clean-up)

Extract `client/` and `server/` over the folders in `D:\Waventravetric` (keep a copy of the old ones first).
No new packages and no new environment variables are needed. Your `.env` files are unchanged.

## New AI features
| Feature | Where customers/admins see it | Server endpoint |
|---|---|---|
| Vetra, a floating AI assistant on every store page (multi-turn, knows the open product, order-aware when signed in, optional voice input) | bottom-right button | `POST /api/ai/chat` |
| AI review summary (pros, cons, best for, rating bars) | product page | `GET /api/ai/products/:id/review-summary` |
| Ask about this product | product page | `POST /api/ai/products/:id/ask` |
| Compare 2-4 products with an AI verdict | `/compare`, "Add to compare" on product page | `POST /api/ai/compare` |
| Smart search in plain language (budget, stock, category understood) | `/semantic-search` | `GET /api/ai/smart-search?q=` |
| AI listing writer (description, features, applications, SEO text) | admin Add / Edit product | `POST /api/ai/admin/product-copy` |

Prices, stock and specifications shown to customers always come from MongoDB, never from the AI reply.
If the AI provider is down, search, compare and review snapshots still work without the AI text.

## Fixes
- CORS now runs before rate limiting, so a "too many requests" reply reaches the browser instead of showing as a connection error.
- Blocked CORS origins return 403 instead of 500.
- Product indexes are declared before the model is compiled (they were being skipped).
- Old "semantic search" no longer sends every product's reviews to the browser.
- 16 admin pages only checked "logged in"; they now require the admin role in the UI too.
- AI support page works for guests (the server already allowed it).
- AI provider retries once on a temporary failure; AI endpoints share a per-visitor rate limit.
- Graceful shutdown no longer hangs; unhandled promise rejections are logged.
- "Loading WaterOS..." and the "PHASE 17 / 18 / ..." labels are gone from the UI.

## Clean-up
- Removed 15 backup/temp files, a stray `server/middlewares/node_modules` (700+ files), duplicate models in `server/middlewares/models`,
  an unused Mongoose model inside the client, a broken `useCartStore.js`, and the sample `pages/api/hello.js`.

## Polish
- Inter font is now actually loaded; keyboard focus rings; reduced-motion support; 404 page; footer links to the AI tools,
  dashboard and notifications (these pages existed but nothing linked to them).

## New files
server: `controllers/aiStudioController.js`, `routes/aiStudioRoutes.js`, `utils/aiCatalog.js`, `tests/ai-catalog.test.js`
client: `components/AIChatWidget.js`, `components/ProductAIPanel.js`, `components/AICopyAssistant.js`, `store/compareStore.js`, `pages/compare.js`, `pages/404.js`
