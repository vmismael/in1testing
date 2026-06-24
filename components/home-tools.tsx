"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolCard } from "@/components/tools/tool-card";
import { CategoryShowcase } from "@/components/category-showcase";
import { PopularChips } from "@/components/popular-tools";
import type { Tool } from "@/lib/tools/types";

export function HomeTools({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return tools.filter((t) =>
      [t.name, t.shortDescription, ...(t.keywords ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, tools]);

  return (
    <div>
      <div className="relative mb-12">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-10"
          aria-label="Search tools"
        />
      </div>

      {filtered ? (
        filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            No tools match “{query}”. More are on the way!
          </p>
        )
      ) : (
        <>
          <PopularChips />
          <CategoryShowcase />
        </>
      )}
    </div>
  );
}
