"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

const WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
    " ",
  );

const UNIT_LABELS = { paragraphs: "Paragraphs", sentences: "Sentences", words: "Words" } as const;
type Unit = keyof typeof UNIT_LABELS;
const MAX = 100;

function rand(n: number) {
  return Math.floor(Math.random() * n);
}

function makeSentence() {
  const len = 6 + rand(10);
  const words = Array.from({ length: len }, () => WORDS[rand(WORDS.length)]);
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

function makeParagraph() {
  const count = 3 + rand(4);
  return Array.from({ length: count }, makeSentence).join(" ");
}

function generate(unit: Unit, count: number, startWithLorem: boolean): string {
  const n = Math.max(1, Math.min(MAX, count));
  let out: string;
  if (unit === "words") {
    out = Array.from({ length: n }, () => WORDS[rand(WORDS.length)]).join(" ");
    out = out.charAt(0).toUpperCase() + out.slice(1) + ".";
  } else if (unit === "sentences") {
    out = Array.from({ length: n }, makeSentence).join(" ");
  } else {
    out = Array.from({ length: n }, makeParagraph).join("\n\n");
  }
  if (startWithLorem) {
    out = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + out;
  }
  return out;
}

export default function LoremIpsumTool() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lorem-count">How many (max {MAX})</Label>
          <Input
            id="lorem-count"
            type="number"
            min={1}
            max={MAX}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(MAX, Number(e.target.value) || 1)))}
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
              <Button key={u} type="button" size="sm" variant={unit === u ? "default" : "outline"} onClick={() => setUnit(u)}>
                {UNIT_LABELS[u]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant={startWithLorem ? "default" : "outline"} onClick={() => setStartWithLorem((v) => !v)}>
          Start with &quot;Lorem ipsum…&quot;
        </Button>
        <Button type="button" onClick={() => setOutput(generate(unit, count, startWithLorem))}>
          Generate
        </Button>
      </div>

      {output && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Generated text</Label>
            <CopyButton value={output} />
          </div>
          <Textarea readOnly value={output} className="min-h-48 bg-background" />
        </div>
      )}
    </div>
  );
}
