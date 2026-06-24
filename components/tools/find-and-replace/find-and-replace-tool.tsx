"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function run(
  text: string,
  find: string,
  replace: string,
  opts: { caseInsensitive: boolean; useRegex: boolean },
): { output: string; count: number; error: string | null } {
  if (!find) return { output: text, count: 0, error: null };
  let flags = "g";
  if (opts.caseInsensitive) flags += "i";
  try {
    const pattern = opts.useRegex ? find : escapeRegExp(find);
    const re = new RegExp(pattern, flags);
    const count = (text.match(re) ?? []).length;
    return { output: text.replace(re, replace), count, error: null };
  } catch (e) {
    return { output: text, count: 0, error: e instanceof Error ? e.message : "Invalid pattern" };
  }
}

export default function FindAndReplaceTool() {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const { output, count, error } = useMemo(
    () => run(text, find, replace, { caseInsensitive, useRegex }),
    [text, find, replace, caseInsensitive, useRegex],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="far-input">Your text</Label>
        <Textarea
          id="far-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to search and replace in…"
          className="min-h-40"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="far-find">Find</Label>
          <Input id="far-find" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Text or pattern to find" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="far-replace">Replace with</Label>
          <Input id="far-replace" value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="Replacement text" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={caseInsensitive ? "default" : "outline"} onClick={() => setCaseInsensitive((v) => !v)}>
          Ignore case
        </Button>
        <Button type="button" size="sm" variant={useRegex ? "default" : "outline"} onClick={() => setUseRegex((v) => !v)}>
          Regular expression
        </Button>
      </div>

      {error && useRegex && (
        <p className="text-sm text-destructive">Invalid regular expression: {error}</p>
      )}

      {text && !error && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Result — {count} match{count === 1 ? "" : "es"} replaced</Label>
            <CopyButton value={output} />
          </div>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{output}</p>
        </div>
      )}
    </div>
  );
}
