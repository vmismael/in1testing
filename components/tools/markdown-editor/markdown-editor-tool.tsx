"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

marked.setOptions({ gfm: true, breaks: true });

const SAMPLE = `# Markdown editor

Type on the left, see it **rendered** on the right.

- Live preview
- GitHub-flavored Markdown
- Runs entirely in your browser

> Nothing you write is uploaded.

\`\`\`js
console.log("hello");
\`\`\`
`;

export default function MarkdownEditorTool() {
  const [markdown, setMarkdown] = useState(SAMPLE);

  const html = useMemo(() => {
    try {
      return marked.parse(markdown, { async: false }) as string;
    } catch {
      return "";
    }
  }, [markdown]);

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="mde-input">Markdown</Label>
            <CopyButton value={markdown} />
          </div>
          <Textarea
            id="mde-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type Markdown here…"
            className="min-h-[28rem] font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Preview</Label>
            <CopyButton value={html} label="Copy HTML" />
          </div>
          <div
            className="md-preview min-h-[28rem] rounded-xl border border-border bg-muted/30 p-4"
            // Live preview of the user's own Markdown, rendered client-side only.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
