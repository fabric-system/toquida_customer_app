# Toquida customer app (web)

Customer-facing **PWA-style** web app: account shell, balance, claim codes, tags, branches. It calls the **product backend only** (see `docs/toquida-customer-app-mvp.md` and `docs/carwash-cloud-api-draft.md`). It does **not** talk to Fabric Desktop, the kiosk runtime, or ESP32 hardware.

## Run locally

```bash
cd toquida_customer_app
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Test on your phone (same Wi‑Fi as the PC)

1. On the PC, from this folder: `npm run dev:host` (listens on all interfaces, not only localhost).
2. Note the **Network** URL in the terminal (e.g. `http://192.168.1.x:5173`).
3. Connect the phone to the **same Wi‑Fi**, open that URL in **Chrome** (Android) or **Safari** (iPhone).
4. **Install / Add to Home Screen**
   - **Android (Chrome):** menu (⋮) → **Install app** or **Add to Home screen**.
   - **iPhone (Safari):** Share → **Add to Home Screen**.

There is no separate APK; it is still the web app, opened from an icon like a typical app. For **any Wi‑Fi / anywhere**, deploy a production build to a host with **HTTPS** (see [Deploy (public URL)](#deploy-public-url) below).

## Deploy (public URL)

Goal: stable `https://app.yourdomain.com` (or a free `*.pages.dev` / `*.netlify.app` URL) so phones can open and **Install / Add to Home Screen** from **any network**.

### 1. Build

**Important:** With **Cloudflare Pages “drag and drop `dist`”**, environment variables you type in the Cloudflare UI **do not** change what is already inside your uploaded JS. You must bake `VITE_*` values **on your PC when you run `vite build`**, then upload **that** `dist/`.

```bash
# Real backend later (needs VITE_API_BASE_URL at build time, e.g. via .env.production)
npm run build

# Demo on Pages with no backend yet — same behavior as local dev mock
npm run build:pages-mock
```

Output is the `dist/` folder.

| Build | When to use |
|-------|-------------|
| `npm run build:pages-mock` | Public demo: mock API embedded (`VITE_USE_MOCK_API=true` via `.env.staging`). **Not for real money.** |
| `npm run build` | Point at a real API: add `.env.production` with `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=https://api.yourdomain.com` (no trailing slash). |

If you used plain `npm run build` without `.env.production`, sign-in shows: *“Set VITE_API_BASE_URL…”* — fix by running `build:pages-mock` and **re-uploading** `dist/`, or by adding a proper `.env.production` and rebuilding.

### 2. SPA routing

`public/_redirects` is copied into `dist/` so **Netlify** and **Cloudflare Pages** serve `index.html` for client routes (e.g. `/home`) on refresh. **Vercel** uses root `vercel.json` rewrites.

### 3. Pick a host (all give HTTPS)

- **Cloudflare Pages:** Git connect (build on Cloudflare) **or** direct upload of prebuilt `dist/`. For **direct upload**, use `npm run build:pages-mock` or `.env.production` as above; dashboard env vars only apply when Cloudflare runs the build for you.
- **Netlify:** Same idea; connect repo or drag-and-drop `dist`.
- **Vercel:** Import repo; framework preset often auto-detects Vite; set env in Project Settings.

### 4. Backend

Your API must allow the **browser origin** of the deployed app in **CORS** (`Access-Control-Allow-Origin` or equivalent).

### 5. After go-live

Re-**Add to Home Screen** from the **new HTTPS URL** (old shortcuts that pointed at `http://192.168…` only work on your LAN while the dev PC is serving).

## Configuration

| Variable | Purpose |
|----------|---------|
| `VITE_USE_MOCK_API` | `true` = in-browser demo data (default in `.env.development`). |
| `VITE_API_BASE_URL` | Backend origin with **no** trailing slash, e.g. `https://api.example.com`. Required when mock is off. |

Copy `.env.example` to `.env.local` and adjust for a real backend.

## Production build

```bash
npm run build
npm run preview   # optional local check of dist/
```

Deploy the `dist/` folder to any static host (**HTTPS**). See [Deploy (public URL)](#deploy-public-url). Ensure the backend allows your site origin in CORS when the app and API are on different domains.

## API surface in code

Typed calls live in `src/api/backend.ts` and mirror the draft customer endpoints (`/auth/*`, `/me`, `/me/balance`, `/me/claim-codes`, etc.). Adjust shapes there when the real backend stabilizes.
