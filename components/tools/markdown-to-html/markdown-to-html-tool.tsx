"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

marked.setOptions({ gfm: true, breaks: false });

export default function MarkdownToHtmlTool() {
  const [markdown, setMarkdown] = useState("");
  const [view, setView] = useState<"html" | "preview">("html");

  const html = useMemo(() => {
    if (!markdown) return "";
    try {
      return marked.parse(markdown, { async: false }) as string;
    } catch {
      return "";
    }
  }, [markdown]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="md-input">Markdown</Label>
        <Textarea
          id="md-input"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder={"# Hello\n\nType or paste **Markdown** here…"}
          className="min-h-44 font-mono text-sm"
        />
      </div>

      {html && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={view === "html" ? "default" : "outline"} onClick={() => setView("html")}>
                HTML
              </Button>
              <Button type="button" size="sm" variant={view === "preview" ? "default" : "outline"} onClick={() => setView("preview")}>
                Preview
              </Button>
            </div>
            {view === "html" && <CopyButton value={html} />}
          </div>

          {view === "html" ? (
            <Textarea readOnly value={html} className="min-h-44 bg-muted/30 font-mono text-sm" />
          ) : (
            <div
              className="md-preview rounded-xl border border-border bg-muted/30 p-4"
              // Preview of the user's own Markdown, rendered client-side only.
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      )}
    </div>
  );
}
