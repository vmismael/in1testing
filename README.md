# ALLIN1

A free SaaS that bundles dozens of fast, SEO-optimized utility tools (PDF, image,
video, text, web). Built for organic search capture and ad monetization.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui
- **Processing:** client-first — most tools run entirely in the browser (no uploads)
- **Server bits:** Next.js Route Handlers + Supabase (no separate backend)
- **SEO:** config-driven pages with dynamic metadata, sitemap, robots, FAQ/HowTo JSON-LD
- **Analytics:** Google Analytics 4 + Microsoft Clarity (env-gated)
- **Deploy target:** Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you need (all optional for local dev)
npm run dev                  # http://localhost:3000
```

The client-side tools (Merge PDF, Image Compressor) work with **no configuration**.
Content, UI and slugs are in **English** (`/merge-pdf`, `/image-compressor`,
`/url-shortener`, `/text-rewriter`), targeting the US/international audience for ads.

## Architecture: adding a tool

Everything is driven by the tool registry. To add a tool:

1. Add a `Tool` object to [`lib/tools/registry.ts`](lib/tools/registry.ts) — slug,
   category, SEO copy (800+ words), `faq`, `howTo`. The page, metadata, sitemap
   entry and JSON-LD schema are generated automatically.
2. For interactive tools, create a processor component under
   [`components/tools/`](components/tools/) (folder name is a functional key, e.g.
   `merge-pdf/`) and map the tool's **slug** to it in the `switch` in
   [`components/tools/tool-processor.tsx`](components/tools/tool-processor.tsx)
   (lazy-loaded, client-only).

That's it — no new routes or metadata wiring needed.

### Key files

| Path | Role |
| --- | --- |
| `lib/tools/registry.ts` | Single source of truth for tools + categories |
| `lib/tools/types.ts` | `Tool` / `CategoryMeta` types |
| `app/[slug]/page.tsx` | Dynamic tool page (`generateStaticParams` + `generateMetadata`) |
| `components/tools/tool-page-layout.tsx` | Shared SEO page template |
| `components/seo/json-ld.tsx` | FAQPage / HowTo / WebApplication / Breadcrumb schema |
| `app/sitemap.ts`, `app/robots.ts` | Generated from the registry |

## Supabase (URL Shortener + lead capture)

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

Short links resolve at `/s/<code>` and increment a click counter.

## AI Rewriter (Reescritor de Texto)

The AI text rewriter streams from a model through the **Vercel AI Gateway**
(`ai@^6`, model `anthropic/claude-haiku-4.5` — swappable in
[`app/api/rewrite/route.ts`](app/api/rewrite/route.ts)).

- **Local:** set `AI_GATEWAY_API_KEY` in `.env.local` (key from the Vercel
  dashboard → AI Gateway).
- **On Vercel:** `vercel env pull` provisions `VERCEL_OIDC_TOKEN`; no static key
  needed. Every team gets free monthly AI Gateway credits.

## Environment variables

See [`.env.example`](.env.example). All are optional for local development; the
URL Shortener and analytics simply stay inactive until configured.

## Deploy

Push to a Vercel project and set the same env vars (including
`NEXT_PUBLIC_SITE_URL`). `npm run build` produces statically generated tool pages.
