import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ slug: tool.slug }));
}

// Tools are statically known; no need to allow unknown slugs.
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const url = absoluteUrl(`/${tool.slug}`);
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    keywords: tool.keywords,
    alternates: { canonical: `/${tool.slug}` },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  return <ToolPageLayout tool={tool} />;
}
