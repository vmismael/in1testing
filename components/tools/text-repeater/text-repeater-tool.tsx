"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

const SEPARATORS = [
  { key: "newline", label: "New line", value: "\n" },
  { key: "space", label: "Space", value: " " },
  { key: "comma", label: "Comma", value: ", " },
  { key: "none", label: "None", value: "" },
] as const;

const MAX_COUNT = 10000;

export default function TextRepeaterTool() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [sep, setSep] = useState<(typeof SEPARATORS)[number]["key"]>("newline");

  const output = useMemo(() => {
    if (!text || count < 1) return "";
    const n = Math.min(count, MAX_COUNT);
    const separator = SEPARATORS.find((s) => s.key === sep)!.value;
    return Array.from({ length: n }, () => text).join(separator);
  }, [text, count, sep]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="repeat-input">Text to repeat</Label>
        <Textarea
          id="repeat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type the text you want to repeat…"
          className="min-h-28"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="repeat-count">Number of times (max {MAX_COUNT})</Label>
          <Input
            id="repeat-count"
            type="number"
            min={1}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(MAX_COUNT, Number(e.target.value) || 1)))}
          />
        </div>
        <div className="space-y-2">
          <Label>Separator</Label>
          <div className="flex flex-wrap gap-2">
            {SEPARATORS.map((s) => (
              <Button
                key={s.key}
                type="button"
                size="sm"
                variant={sep === s.key ? "default" : "outline"}
                onClick={() => setSep(s.key)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {output && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Result</Label>
            <CopyButton value={output} />
          </div>
          <Textarea readOnly value={output} className="min-h-40 bg-background" />
        </div>
      )}
    </div>
  );
}
