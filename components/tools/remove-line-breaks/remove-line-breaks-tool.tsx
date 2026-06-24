"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

const MODES = [
  {
    key: "spaces",
    label: "Replace with spaces",
    fn: (s: string) => s.replace(/\s*\r?\n\s*/g, " ").replace(/[ \t]{2,}/g, " ").trim(),
  },
  {
    key: "remove",
    label: "Remove completely",
    fn: (s: string) => s.replace(/\r?\n/g, "").trim(),
  },
  {
    key: "paragraphs",
    label: "Keep paragraphs",
    fn: (s: string) =>
      s
        .split(/\n{2,}/)
        .map((p) => p.replace(/\s*\r?\n\s*/g, " ").replace(/[ \t]{2,}/g, " ").trim())
        .filter(Boolean)
        .join("\n\n"),
  },
] as const;

type ModeKey = (typeof MODES)[number]["key"];

export default function RemoveLineBreaksTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ModeKey>("spaces");

  const output = useMemo(() => {
    const m = MODES.find((x) => x.key === mode)!;
    return text ? m.fn(text) : "";
  }, [text, mode]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rlb-input">Your text</Label>
        <Textarea
          id="rlb-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text with line breaks here…"
          className="min-h-40"
        />
      </div>

      <div className="space-y-2">
        <Label>How to handle breaks</Label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Button
              key={m.key}
              type="button"
              size="sm"
              variant={mode === m.key ? "default" : "outline"}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {output && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Result</Label>
            <CopyButton value={output} />
          </div>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{output}</p>
        </div>
      )}
    </div>
  );
}
