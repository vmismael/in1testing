"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

function words(s: string): string[] {
  return s.match(/[A-Za-z0-9]+/g) ?? [];
}

const CASES = [
  { key: "upper", label: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
  { key: "lower", label: "lowercase", fn: (s: string) => s.toLowerCase() },
  {
    key: "title",
    label: "Title Case",
    fn: (s: string) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  },
  {
    key: "sentence",
    label: "Sentence case",
    fn: (s: string) =>
      s.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (m) => m.toUpperCase()),
  },
  {
    key: "camel",
    label: "camelCase",
    fn: (s: string) =>
      words(s)
        .map((w, i) =>
          i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join(""),
  },
  { key: "snake", label: "snake_case", fn: (s: string) => words(s).map((w) => w.toLowerCase()).join("_") },
  { key: "kebab", label: "kebab-case", fn: (s: string) => words(s).map((w) => w.toLowerCase()).join("-") },
] as const;

type CaseKey = (typeof CASES)[number]["key"];

export default function CaseConverterTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseKey>("upper");

  const output = useMemo(() => {
    const c = CASES.find((x) => x.key === mode)!;
    return text ? c.fn(text) : "";
  }, [text, mode]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="case-input">Your text</Label>
        <Textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here…"
          className="min-h-32"
        />
      </div>

      <div className="space-y-2">
        <Label>Case</Label>
        <div className="flex flex-wrap gap-2">
          {CASES.map((c) => (
            <Button
              key={c.key}
              type="button"
              size="sm"
              variant={mode === c.key ? "default" : "outline"}
              onClick={() => setMode(c.key)}
            >
              {c.label}
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
