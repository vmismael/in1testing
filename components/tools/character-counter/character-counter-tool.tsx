"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

function analyze(text: string) {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+/g)?.length ?? 1) : 0;
  return { characters, charactersNoSpaces, words, lines, sentences };
}

export default function CharacterCounterTool() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyze(text), [text]);

  const metrics = [
    { label: "Characters", value: stats.characters },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Words", value: stats.words },
    { label: "Lines", value: stats.lines },
    { label: "Sentences", value: stats.sentences },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-2xl font-semibold tabular-nums">{m.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="character-counter-input">Your text</Label>
          <CopyButton value={text} />
        </div>
        <Textarea
          id="character-counter-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here…"
          className="min-h-48"
        />
      </div>
    </div>
  );
}
