# Design — "Featured tools" (Popular) section on the home

**Date:** 2026-06-23
**Status:** Approved (design)

## Context

The ALLIN1 home today is: a dark hero, then a light tools area containing a search
input and the "Browse by category" showcase (`components/category-showcase.tsx`). With
28 tools now shipped, there is no fast entry point to the highest-demand tools — a new
visitor has to search or browse a category to reach them.

This adds a **"Featured tools"** section that surfaces a curated set of the most
searched-for / most-mentioned tools (within our catalog) right at the top of the page, so
visitors can jump straight into the tools that bring the most organic traffic. The product
is in **English** (UI, content, slugs); the user communicates in pt-BR.

The visual direction was chosen against a reference and three mockups via the visual
companion: **icon-forward dark bento** (no stock photos — on-brand with the Apple-minimalist
design system, no new assets), with a **uniform 3×2 grid** layout.

## Goals

- A prominent, scannable entry to the 6 most popular tools, high on the home page.
- Strong internal linking (SEO) from the home to top tool pages, rendered server-side (SSG).
- Fully consistent with the existing design system (Action Blue, Inter, pill/rounded
  language, dark product tiles) and the config-driven engine (`lib/tools/registry.ts`).

## Non-goals

- No registry schema change (no new `Tool` field). Curation is an explicit editorial list.
- No stock photography or new image assets.
- No per-user personalization or click-based "trending" computation — the set is curated.
- Not tied to the search box (the section is static, always visible below the hero).

## Placement & structure

- A new **full-bleed dark band** placed in `app/page.tsx` **immediately after the hero** and
  **before** the light tools container (search + category showcase).
- Rhythm: dark hero → dark Featured band → light "Browse by category". The two dark bands
  read as a cohesive "top"; the light category section restores the light/dark alternation.
  To distinguish the two dark bands, the Featured band uses a micro-step darker surface than
  the hero (hero `#1d1d1f`; Featured `#161617`), per the DESIGN-apple surface-tile steps.

## Component

- **New file `components/popular-tools.tsx`** — a **server component** (no `"use client"`),
  so it renders at build time as static HTML with real `<a>` links (good for SEO/crawl).
- It owns a curated, ordered list of slugs and resolves them through the registry:
  ```ts
  const FEATURED_SLUGS = [
    "background-remover",
    "merge-pdf",
    "image-compressor",
    "mp4-to-mp3",
    "qr-code-generator",
    "word-counter",
  ];
  const featured = FEATURED_SLUGS
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is Tool => Boolean(t)); // guard against a renamed/removed slug
  ```
- Rendered in `app/page.tsx` between the hero `</section>` and the `#tools` container. It is
  independent of `HomeTools` (search), so it always shows.

## Featured set (6, all client-side → all show "No upload")

`background-remover`, `merge-pdf`, `image-compressor`, `mp4-to-mp3`, `qr-code-generator`,
`word-counter` — a high-search pick spread across categories (image, PDF, image, video, web,
text) to show the site's breadth.

## Card anatomy (uniform 3×2 grid)

Each card is a `<Link href={'/' + tool.slug}>` (whole card clickable):

- **Surface:** dark tile `#26262a`, `rounded-2xl`, 1px `border-white/6`, padding ~18px,
  subtle hover (border brightens to Action Blue / faint lift), `transition-colors`.
- **Icon:** the tool's registry `icon` via the existing `Icon` component, inside a
  ~40px rounded-xl square tinted with **Sky Link Blue** (`#2997ff` at ~15% bg, icon in
  `#2997ff`). Action Blue (`#0066cc`) is intentionally avoided here because it disappears on
  dark — DESIGN-apple specifies Sky Link Blue for accents on dark surfaces.
- **Title:** `tool.name`, white, font-semibold.
- **Description:** `tool.shortDescription`, muted light (`#b9b9bd`), small.
- **Badge:** "No upload" when `tool.processing === "client"` — subtle translucent pill
  (`bg-white/10`, light blue text), top-right. (All 6 are client-side.)

## Copy (English)

- Eyebrow label: **"Popular"** (Sky Link Blue, small, centered).
- Heading (`<h2>`): **"Featured tools"** (white, semibold, tight tracking).
- Subtitle: **"Start with our most-used tools."** (muted, centered).

## Responsive

- Grid: `grid-cols-1` (mobile) → `sm:grid-cols-2` → `lg:grid-cols-3`, gap ~14px,
  centered with a max width consistent with the rest of the home (~`max-w-5xl`).
- Section padding mirrors the hero/section rhythm (generous vertical padding).

## Accessibility

- Each card is a single focusable link with an accessible name (the tool name); the icon is
  `aria-hidden` (already handled by the `Icon` component).
- Color contrast: white/`#b9b9bd` text on `#26262a` meets AA for the title; descriptions are
  secondary. The "Popular" eyebrow in `#2997ff` on `#161617` is sufficiently legible.

## Files

- **Add:** `components/popular-tools.tsx`.
- **Edit:** `app/page.tsx` — import and render `<PopularTools />` between the hero and the
  `#tools` container.
- No changes to `lib/tools/registry.ts`, `types.ts`, or the engine.

## Verification

- `npm run build` (section renders as static HTML in the home; links to the 6 tool pages
  present) and `npm run lint` clean.
- Manual: the 6 cards link to the correct `/[slug]` pages; layout collapses 3→2→1 columns;
  dark band sits directly under the hero; "No upload" badges show.
- Visual check against the approved companion mockup (dark band, uniform 3×2, Sky Link Blue
  icon tint).

## Future (out of scope)

- Optionally drive the existing "Popular" badge on `category-showcase.tsx` from the same
  curated source; a registry `popular` flag if curation ever needs to be data-driven; a
  "trending" variant based on real analytics once available.
