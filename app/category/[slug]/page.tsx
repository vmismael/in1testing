import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ToolCard } from "@/components/tools/tool-card";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icons";
import { categories, getToolsByCategory } from "@/lib/tools/registry";
import { siteConfig } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  const title = `${category.label} Tools | ${siteConfig.name}`;
  return {
    title,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      type: "website",
      title,
      description: category.description,
      url: `${siteConfig.url}/category/${category.slug}`,
      siteName: siteConfig.name,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const tools = getToolsByCategory(category.slug);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="text-foreground">{category.label}</span>
      </nav>

      <header className="mb-10">
        <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon name={category.icon} className="size-6" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {category.label} Tools
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{category.description}</p>
      </header>

      {tools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, i) => (
            <Reveal key={tool.slug} delay={(i % 3) * 80} className="h-full">
              <ToolCard tool={tool} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <p className="text-muted-foreground">
            New {category.label} tools are coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
