"use client";

import { useMemo, useState } from "react";
import { diffLines, diffWords, type Change } from "diff";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MODES = [
  { key: "lines", label: "By line" },
  { key: "words", label: "By word" },
] as const;
type ModeKey = (typeof MODES)[number]["key"];

export default function TextDiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [mode, setMode] = useState<ModeKey>("lines");

  const parts: Change[] = useMemo(() => {
    if (!left && !right) return [];
    return mode === "lines" ? diffLines(left, right) : diffWords(left, right);
  }, [left, right, mode]);

  const summary = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const p of parts) {
      if (p.added) added += p.count ?? 1;
      else if (p.removed) removed += p.count ?? 1;
    }
    return { added, removed };
  }, [parts]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="diff-left">Original</Label>
          <Textarea id="diff-left" value={left} onChange={(e) => setLeft(e.target.value)} placeholder="Paste the original text…" className="min-h-44 font-mono text-sm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="diff-right">Changed</Label>
          <Textarea id="diff-right" value={right} onChange={(e) => setRight(e.target.value)} placeholder="Paste the changed text…" className="min-h-44 font-mono text-sm" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label className="mr-1">Compare</Label>
        {MODES.map((m) => (
          <Button key={m.key} type="button" size="sm" variant={mode === m.key ? "default" : "outline"} onClick={() => setMode(m.key)}>
            {m.label}
          </Button>
        ))}
      </div>

      {parts.length > 0 && (
        <div className="space-y-2">
          <Label>
            Differences — <span className="text-emerald-600">+{summary.added} added</span>,{" "}
            <span className="text-rose-600">−{summary.removed} removed</span>
          </Label>
          <div className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
            <pre className="whitespace-pre-wrap break-words">
              {parts.map((p, i) => (
                <span
                  key={i}
                  className={
                    p.added
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : p.removed
                        ? "bg-rose-500/15 text-rose-700 line-through dark:text-rose-300"
                        : "text-muted-foreground"
                  }
                >
                  {p.value}
                </span>
              ))}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
