# Maheshwari Jewellers — App Spec

## What it is
Public jewellery catalogue website + admin dashboard for Maheshwari Jewellers, a local
jewellery store in Modinagar, Uttar Pradesh. Enquiry-based (no checkout in v1):
customers browse products and contact the store via WhatsApp / phone / Google Maps.

Business facts (verified, do not invent more):
- Phone 9837149835, WhatsApp 9837149835 (`https://wa.me/919837149835`)
- Hours: 10:00 AM – 8:00 PM daily, CLOSED every Tuesday (settings: `opening_hours` + `closed_days`)
- Maps: https://maps.app.goo.gl/oWX8MP7Jm5HNGFD56?g_st=ac
- Focus: Silver (Regular / 925 Sterling / 999 Fine) plus Gold.

## Stack
FastAPI + MongoDB (motor) backend; Vite + React 19 + Tailwind v4 + shadcn (base-nova).
All routes on `api_router` under `/api`. Images stored on disk in `backend/uploads/`,
served at `GET /api/media/{filename}`.

## Data model (backend/models/catalogue.py ↔ frontend/src/lib/types.ts)
- `products`: id, name, sku, metal(gold|silver), purity(regular|925|999|24K|22K|18K|14K),
  category, subcategory, weight, price(float|null), price_type(exact|on_request|contact),
  description, gender(women|men|unisex), finish, stone_details, size,
  availability(in_stock|made_to_order|out_of_stock), featured, new_arrival, published,
  is_demo, images[{url,alt}], created_at, updated_at
- `categories`: id, name, slug, metal(gold|silver|both)
- `settings` (single doc, key="site"): business_name, phone, whatsapp, maps_url, address,
  opening_hours, about, description, instagram, facebook, other_social, logo_url,
  banner_url, rates{gold_24k, gold_22k, silver_999, silver_925, unit, updated_on}
- `admins`, `sessions` (httpOnly cookie `mj_session`, 14-day TTL)

## API
Public: `GET /api/products` (filters: metal, purity, gender, category, availability,
featured, new_arrival, search, min_price, max_price, sort, page, page_size — published
only), `GET /api/products/{id}`, `GET /api/categories?metal=`, `GET /api/settings`.
Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
Admin (cookie required, 401 otherwise): `GET/POST /api/admin/products`,
`GET/PUT/DELETE /api/admin/products/{id}`, `POST/DELETE /api/admin/categories`,
`PUT /api/admin/settings`, `POST /api/admin/upload` (multipart `files`).

## Routes
`/` Home · `/catalogue` (query-param filters) · `/product/:id` · `/about` · `/contact`
· `/admin/login` · `/admin` (tabs: Dashboard, Products, Categories, Rates, Settings).
Nav links for Gold/Silver/925/999/Men/Women/New Arrivals are `/catalogue?...` presets.

## Auth / roles
Single admin role. Login sets an httpOnly cookie; `/admin` redirects to `/admin/login`
on a 401 from `GET /api/auth/me`. Public site never calls admin endpoints.
`POST /api/auth/change-password` (cookie + current password, new min 8 chars) lets the
owner rotate the password from Website Settings; it re-issues the caller's cookie and
revokes all other sessions.

## Production provisioning (no manual steps)
`server.py` lifespan `_boot()` runs on every start: `ensure_indexes()`,
`ensure_default_admin()`, then `ensure_business_defaults()` (backend/lib/bootstrap.py).
On a fresh production DB this creates the admin account, the settings document
(phone/WhatsApp/hours defaults) and the 33 standard categories. It is idempotent:
settings use `$setOnInsert` and categories only seed when the collection is empty, so
redeploys never overwrite owner edits. `seed.py` additionally adds the 6 DEMO products
and force-migrates phone/WhatsApp/hours on an existing DB.

## Seed data (backend/seed.py, idempotent)
33 categories (18 silver, 15 gold) + 6 DEMO products (all `is_demo=true`, published):
DEMO Silver Ring – 925 Sterling (₹1,850), DEMO Silver Chain – 925 Sterling (contact),
DEMO Silver Payal (Regular Silver, on request), DEMO 999 Fine Silver Coin – 10g (₹1,150),
DEMO Gold Ring – 22K (contact), DEMO Gold Chain – 22K (on request).
Rates start as "—" so the strip shows a "contact us" line until the admin sets them.
