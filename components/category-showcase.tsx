import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Icon, type IconName } from "@/components/icons";
import pdfIcon from "@/images/pdf_final.png";
import imageIcon from "@/images/imagem_final.png";
import videoIcon from "@/images/video_icone.png";
import iaIcon from "@/images/ia_final.png";
import webIcon from "@/images/web_logo.png";

interface ShowcaseCategory {
  slug: string;
  // Either a curated PNG illustration or a lucide icon (used until a matching
  // illustration is commissioned for newer categories).
  icon?: StaticImageData;
  lucide?: IconName;
  title: string;
  blurb: string;
}

// Curated "browse by category" cards. Slugs map to /category/<slug> pages.
const SHOWCASE: ShowcaseCategory[] = [
  { slug: "pdf", icon: pdfIcon, title: "PDF tools", blurb: "Merge, split, compress and convert PDFs." },
  { slug: "image", icon: imageIcon, title: "Image tools", blurb: "Compress, resize and edit your images." },
  { slug: "video", icon: videoIcon, title: "Video & audio tools", blurb: "Convert and process your media files." },
  { slug: "text", icon: iaIcon, title: "Text & AI tools", blurb: "Rewrite, summarize and improve your content." },
  { slug: "web", icon: webIcon, title: "Web tools", blurb: "QR codes, passwords, JSON and link utilities." },
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
              <div className="relative flex aspect-square items-end justify-center bg-secondary">
                {c.icon ? (
                  <Image
                    src={c.icon}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                    className="object-contain object-bottom p-6"
                  />
                ) : c.lucide ? (
                  <Icon name={c.lucide} className="mb-6 size-14 text-foreground/70" strokeWidth={1.5} />
                ) : null}
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
