# Frontend QA Checker (DevCheck)

Repository: [github.com/choijinwon/DevCheck](https://github.com/choijinwon/DevCheck)

Next.js app that runs Puppeteer + axe-core accessibility checks on a URL.

## Environment

Copy the example file and fill in values only on your machine (these files stay out of Git):

```bash
cp .env.example .env
```

`SUPABASE_*` is optional; without it, results use the browser session only.

| Variable | Purpose |
|----------|---------|
| `POST_LOAD_DELAY_MS` | Optional `0`–`2000` ms pause after load before axe (SPAs). Uses part of the 10s budget. |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window for analyze API (default `60000`). |
| `RATE_LIMIT_MAX` | Max analyze requests per IP per window (default `20`). |
| `PUPPETEER_EXECUTABLE_PATH` | Optional path to Chrome/Chromium if you don’t use Puppeteer’s downloaded browser. |

## Operations

- **QA:** Run `npm run test` (Vitest) and see [docs/QA.md](docs/QA.md) for a manual smoke checklist.
- **CI scan:** With the app running, `SCAN_URL=https://example.com npm run scan:ci` (see [docs/QA.md](docs/QA.md) for env vars).
- **Scan history:** Recent analyses are listed at `/history` (stored in the browser only, max 20).
- **Health:** `GET /api/health` — no browser; suitable for uptime checks.
- **Rate limits:** Applied per client IP (`x-forwarded-for` / `x-real-ip`). In-memory only; use a gateway or Redis for multi-instance production.
- **Deployment:** Full Puppeteer needs a Node runtime with Chrome/Chromium. Serverless hosts often need `puppeteer-core` + a bundled Chromium or a dedicated worker.

## Netlify

This repo includes [`netlify.toml`](netlify.toml) and [`@netlify/plugin-nextjs`](https://docs.netlify.com/frameworks/next-js/overview/). On Netlify, `NETLIFY=true` is set automatically; the analyzer uses [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) + `puppeteer-core` instead of downloading Chrome in `postinstall`.

1. In the [Netlify dashboard](https://app.netlify.com/), **Add new site** → **Import an existing project** and connect the GitHub repo (`choijinwon/DevCheck`).
2. Leave **Build command** `npm run build` and let the plugin pick publish settings (no manual `publish` path needed).
3. Optional: copy env vars from `.env.example` (e.g. Supabase, rate limits) in **Site configuration → Environment variables**.

**Limits:** Analyze uses up to ~10s of work per request; Netlify Functions default to a **10s timeout** (cold start + browser can hit this on free tier). Paid plans can request up to **26s** via [Netlify Support](https://answers.netlify.com/). If scans fail with timeouts, try again (warm instance) or upgrade / ask for a longer limit.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
```

Puppeteer v24+ downloads Chrome separately. `npm install` runs `postinstall` to fetch it into `~/.cache/puppeteer`. If analysis fails with “Could not find Chrome”, run:

```bash
npm run install-browser
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
