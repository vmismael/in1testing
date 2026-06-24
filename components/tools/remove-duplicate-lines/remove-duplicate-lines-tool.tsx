"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

function dedupe(
  text: string,
  opts: { caseInsensitive: boolean; trim: boolean; sort: boolean },
) {
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const candidate = opts.trim ? line.trim() : line;
    const key = opts.caseInsensitive ? candidate.toLowerCase() : candidate;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  if (opts.sort) out.sort((a, b) => a.localeCompare(b));
  return { result: out.join("\n"), removed: lines.length - out.length };
}

export default function RemoveDuplicateLinesTool() {
  const [text, setText] = useState("");
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [trim, setTrim] = useState(true);
  const [sort, setSort] = useState(false);

  const { result, removed } = useMemo(
    () => (text ? dedupe(text, { caseInsensitive, trim, sort }) : { result: "", removed: 0 }),
    [text, caseInsensitive, trim, sort],
  );

  const toggles = [
    { label: "Ignore case", value: caseInsensitive, set: setCaseInsensitive },
    { label: "Trim whitespace", value: trim, set: setTrim },
    { label: "Sort A→Z", value: sort, set: setSort },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rdl-input">Your list</Label>
        <Textarea
          id="rdl-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a list — one item per line…"
          className="min-h-40"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {toggles.map((t) => (
          <Button
            key={t.label}
            type="button"
            size="sm"
            variant={t.value ? "default" : "outline"}
            onClick={() => t.set((v) => !v)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {text && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Result — {removed} duplicate{removed === 1 ? "" : "s"} removed</Label>
            <CopyButton value={result} />
          </div>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
}
