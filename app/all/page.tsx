import type { Metadata } from "next";
import { ToolPool } from "@/components/tool-pool";
import { getAllTools } from "@/lib/tools/registry";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `All tools | ${siteConfig.name}`,
  description:
    "Browse every tool in one place. Drag to explore the canvas or search to filter down to exactly what you need.",
  alternates: { canonical: "/all" },
};

export default function AllToolsPage() {
  const tools = getAllTools();
  return <ToolPool tools={tools} />;
}
