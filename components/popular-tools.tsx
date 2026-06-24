import Link from "next/link";
import { Icon } from "@/components/icons";
import { getToolBySlug } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

// Curated, ordered editorial pick of the most searched-for tools. Edit to reorder.
const FEATURED_SLUGS = [
  "background-remover",
  "merge-pdf",
  "image-compressor",
  "mp4-to-mp3",
  "qr-code-generator",
  "word-counter",
];

/**
 * A small, low-key row of "popular tool" chips shown under the search bar — a quick
 * shortcut to the most-used tools without competing with the category showcase.
 */
export function PopularChips() {
  const featured = FEATURED_SLUGS
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is Tool => Boolean(t));

  if (featured.length === 0) return null;

  return (
    <div className="mb-12">
      <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-primary">
        Popular
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {featured.map((tool) => (
          <Link
            key={tool.slug}
            href={`/${tool.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <Icon name={tool.icon} className="size-4 text-primary" />
            {tool.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
