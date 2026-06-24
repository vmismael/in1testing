import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/lib/tools/types";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/${tool.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon name={tool.icon} className="size-5" />
        </span>
        {tool.processing === "client" && (
          <Badge variant="secondary" className="text-[10px]">
            No upload
          </Badge>
        )}
      </div>
      <div>
        <h3 className="flex items-center gap-1 font-semibold">
          {tool.name}
          <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{tool.shortDescription}</p>
      </div>
    </Link>
  );
}
