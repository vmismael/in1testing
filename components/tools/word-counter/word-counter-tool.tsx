"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

const WORDS_PER_MINUTE = 200;

function analyze(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+/g)?.length ?? 1) : 0;
  const paragraphs = trimmed ? trimmed.split(/\n{2,}/).filter((p) => p.trim()).length : 0;
  const readingMinutes = words ? Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) : 0;
  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingMinutes };
}

export default function WordCounterTool() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyze(text), [text]);

  const metrics = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    {
      label: "Reading time",
      value: stats.readingMinutes ? `${stats.readingMinutes} min` : "0 min",
    },
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
          <Label htmlFor="word-counter-input">Your text</Label>
          <CopyButton value={text} />
        </div>
        <Textarea
          id="word-counter-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here…"
          className="min-h-48"
        />
      </div>
    </div>
  );
}
