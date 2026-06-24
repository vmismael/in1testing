"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

function slugify(text: string, opts: { separator: string; lowercase: boolean }): string {
  let s = text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // strip accents
    .replace(/[^a-zA-Z0-9\s\-_]/g, "") // drop non-url chars
    .trim()
    .replace(/[\s-_]+/g, opts.separator);
  if (opts.lowercase) s = s.toLowerCase();
  // trim leading/trailing separators
  const sep = opts.separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return s.replace(new RegExp(`^${sep}+|${sep}+$`, "g"), "");
}

export default function SlugifyTool() {
  const [text, setText] = useState("");
  const [separator, setSeparator] = useState("-");
  const [lowercase, setLowercase] = useState(true);

  const output = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((line) => (line.trim() ? slugify(line, { separator, lowercase }) : ""))
        .join("\n"),
    [text, separator, lowercase],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="slug-input">Your text</Label>
        <Textarea
          id="slug-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a title or paste multiple lines to slugify each one…"
          className="min-h-32"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label className="mr-1">Separator</Label>
        <Button type="button" size="sm" variant={separator === "-" ? "default" : "outline"} onClick={() => setSeparator("-")}>
          Hyphen ( - )
        </Button>
        <Button type="button" size="sm" variant={separator === "_" ? "default" : "outline"} onClick={() => setSeparator("_")}>
          Underscore ( _ )
        </Button>
        <Button type="button" size="sm" variant={lowercase ? "default" : "outline"} onClick={() => setLowercase((v) => !v)}>
          lowercase
        </Button>
      </div>

      {output.trim() && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Slug</Label>
            <CopyButton value={output} />
          </div>
          <p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{output}</p>
        </div>
      )}
    </div>
  );
}
