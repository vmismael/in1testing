import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Icon, type IconName } from "@/components/icons";

interface ShowcaseCategory {
  slug: string;
  // Lucide icon shown inside a blue badge — same mark as the /category/<slug>
  // page header (single visual language across home and category pages).
  lucide: IconName;
  title: string;
  blurb: string;
}

// Curated "browse by category" cards. Slugs map to /category/<slug> pages.
// Icons mirror `categories[].icon` in lib/tools/registry.ts.
const SHOWCASE: ShowcaseCategory[] = [
  { slug: "pdf", lucide: "file-text", title: "PDF tools", blurb: "Merge, split, compress and convert PDFs." },
  { slug: "image", lucide: "image", title: "Image tools", blurb: "Compress, resize and edit your images." },
  { slug: "video", lucide: "film", title: "Video & audio tools", blurb: "Convert and process your media files." },
  { slug: "text", lucide: "type", title: "Text & AI tools", blurb: "Rewrite, summarize and improve your content." },
  { slug: "web", lucide: "globe", title: "Web tools", blurb: "QR codes, passwords, JSON and link utilities." },
  { slug: "calculators", lucide: "calculator", title: "Calculators", blurb: "Finance, health and everyday calculators." },
];

export function CategoryShowcase() {
  return (
    <section>
      <Reveal>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight">Categories</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Browse by category
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-muted-foreground">
            Find exactly what you&apos;re looking for.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {SHOWCASE.map((c, i) => (
          <Reveal key={c.slug} delay={i * 90} className="h-full">
            <Link
              href={`/category/${c.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
            >
              <div className="flex aspect-square items-center justify-center bg-secondary">
                <Icon name={c.lucide} className="size-14 text-primary" strokeWidth={1.75} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  See all
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
