"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

const MODES = [
  {
    key: "characters",
    label: "Reverse characters",
    fn: (s: string) => [...s].reverse().join(""),
  },
  {
    key: "words",
    label: "Reverse word order",
    fn: (s: string) => s.split(/\s+/).reverse().join(" "),
  },
  {
    key: "lines",
    label: "Reverse line order",
    fn: (s: string) => s.split(/\r?\n/).reverse().join("\n"),
  },
] as const;

type ModeKey = (typeof MODES)[number]["key"];

export default function ReverseTextTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ModeKey>("characters");

  const output = useMemo(() => {
    const m = MODES.find((x) => x.key === mode)!;
    return text ? m.fn(text) : "";
  }, [text, mode]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reverse-input">Your text</Label>
        <Textarea
          id="reverse-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here…"
          className="min-h-40"
        />
      </div>

      <div className="space-y-2">
        <Label>Reverse by</Label>
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
