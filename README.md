# Maheshwari Jewellers

Jewellery catalogue website for **Maheshwari Jewellers** (Modinagar): public catalogue,
admin dashboard, gold/silver rates, WhatsApp enquiry. No online payments.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 |
| Backend | FastAPI + Motor (async MongoDB) |
| Database | MongoDB (local or Atlas) |
| Images | S3-compatible object storage (e.g. Cloudflare R2); local `backend/uploads/` fallback for development |

## Layout

```
backend/     FastAPI app (entry: server.py)
frontend/    Vite React SPA
tests/       Playwright workspace
.env.example Environment variable template
render.yaml  Optional Render Blueprint (not deployed automatically)
```

## Local development

### 1. Environment files

```bash
# Backend
cp .env.example backend/.env
# Edit backend/.env — at minimum set:
#   MONGO_URL, DB_NAME, ADMIN_USERNAME, ADMIN_PASSWORD, FRONTEND_URL

# Frontend
cp .env.example frontend/.env
# Keep only VITE_API_URL=http://localhost:8000 in frontend/.env (or create a minimal file)
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

API: http://localhost:8000 — health: http://localhost:8000/api/health

Optional seed (demo products + force contact/hours migration):

```bash
cd backend
python seed.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

**Node.js 20.19+** is required for the frontend toolchain (Vite 8).

With `VITE_API_URL=http://localhost:8000`, the browser calls the API directly (CORS via `FRONTEND_URL`).
If you leave `VITE_API_URL` empty, Vite proxies `/api` → `http://localhost:8000`.

### 4. Production build (frontend)

```bash
cd frontend
npm install
npm run build
# output: frontend/dist
```

### 5. Production start (backend)

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port $PORT
```

## Important environment variables

See [`.env.example`](.env.example) for the full list.

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_API_URL` | Frontend build | Backend origin (`https://api.example.com`) |
| `MONGO_URL` / `DB_NAME` | Backend | MongoDB Atlas (or local) |
| `FRONTEND_URL` | Backend | CORS allowlist (comma-separated OK) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Backend | Initial admin only (idempotent) |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | Backend | Cross-origin cookies: `true` / `none` in production |
| `S3_*` | Backend | Persistent product images (R2/S3). Omit for local disk. |

## Admin

- Login: `/admin/login`
- On first boot with an empty `admins` collection, the backend creates one admin from `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
- If you migrate an existing MongoDB that already has an admin, that account is left unchanged (`ADMIN_PASSWORD` does not overwrite it).
- Password is never stored in plaintext; change it from Website Settings after deploy.
- Session cookie: httpOnly `mj_session` (14-day TTL in MongoDB).
- Cross-origin hosting (static frontend + separate API): set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`, and ensure `FRONTEND_URL` matches the site origin.

## Business facts

- Phone / WhatsApp display: **9837149835**
- WhatsApp links: `https://wa.me/919837149835`
- Hours: 10:00 AM – 8:00 PM; **Tuesday CLOSED**

## Deployment notes (Render + Atlas + R2)

1. Create a MongoDB Atlas cluster; put the URI in `MONGO_URL`.
2. Create a Cloudflare R2 (or S3) bucket + public access URL; set all `S3_*` vars.
3. Deploy backend as a Web Service from `backend/` with the start command above; set cookie flags for cross-origin.
4. Deploy frontend as a Static Site from `frontend/`; set `VITE_API_URL` to the backend URL **before** build.
5. Set backend `FRONTEND_URL` to the static site URL.
6. Do not rely on `backend/uploads/` on Render — disk is ephemeral.

`render.yaml` is provided as a starting Blueprint; fill secrets in the dashboard and deploy when ready.
