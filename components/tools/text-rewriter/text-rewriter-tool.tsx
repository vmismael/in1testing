"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_CHARS = 4000;

// Mode keys MUST match the `MODES` enum in app/api/rewrite/route.ts.
const MODES = [
  { key: "improve", label: "Improve" },
  { key: "formal", label: "Formal" },
  { key: "casual", label: "Casual" },
  { key: "summarize", label: "Summarize" },
  { key: "fix", label: "Fix grammar" },
  { key: "expand", label: "Expand" },
] as const;

type ModeKey = (typeof MODES)[number]["key"];

export default function TextRewriterTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ModeKey>("improve");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function rewrite() {
    if (!text.trim()) {
      toast.warning("Type or paste some text.");
      return;
    }
    setBusy(true);
    setOutput("");
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not rewrite the text.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
      // A 200 with no text means the model call failed mid-stream.
      if (!acc.trim()) {
        throw new Error(
          "Could not generate the rewrite. Check the AI (AI Gateway) configuration and try again.",
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rewrite-input">Your text</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {text.length}/{MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="rewrite-input"
          value={text}
          maxLength={MAX_CHARS}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          placeholder="Type or paste the text you want to rewrite…"
          className="min-h-32"
        />
      </div>

      <div className="space-y-2">
        <Label>Style</Label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Button
              key={m.key}
              type="button"
              size="sm"
              variant={mode === m.key ? "default" : "outline"}
              disabled={busy}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <Button type="button" size="lg" onClick={rewrite} disabled={busy || !text.trim()}>
        {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {busy ? "Rewriting…" : "Rewrite"}
      </Button>

      {output && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Result</Label>
            <Button type="button" variant="outline" size="sm" onClick={copy} disabled={busy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className={cn("whitespace-pre-wrap leading-relaxed", busy && "opacity-80")}>
            {output}
          </p>
        </div>
      )}
    </div>
  );
}
