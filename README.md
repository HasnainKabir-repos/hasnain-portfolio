# A Z Hasnain Kabir: portfolio

Next.js (App Router, TypeScript), exported as a static site.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out
```

## Where things live

| What | File |
|---|---|
| Status table, work history, email and GitHub links | `lib/content.ts` |
| Page sections and findings text | `app/page.tsx` |
| Batching simulator UI | `components/BatchingSim.tsx` |
| Simulator model (admission gates, step times) | `lib/sim.ts` |
| Page-table navigation | `components/PageTableNav.tsx` |
| Finding rows and bar charts | `components/Finding.tsx` |
| Styles, light and dark | `app/globals.css` |

Fonts (Spectral, Inter, JetBrains Mono) are self-hosted through `@fontsource`, so the build needs no network access.

## Deploy

**Vercel:** push to GitHub, import the repo at vercel.com/new. It detects Next.js; every push to `main` redeploys.

**GitHub Pages:** `npm run build` and publish `./out`. For a project site at `username.github.io/repo`, add `basePath: "/repo"` to `next.config.mjs` first. A repo named `username.github.io` needs no change.
