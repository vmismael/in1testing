"use client";

import { useState } from "react";
import { AlignLeft, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function transform(minify: boolean) {
    if (!input.trim()) {
      setOutput("");
      setError("Paste some JSON to format.");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, minify ? undefined : 2));
      setError(null);
    } catch (err) {
      setOutput("");
      setError(err instanceof Error ? err.message : "Invalid JSON.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="json-input">Your JSON</Label>
        <Textarea
          id="json-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"hello":"world","items":[1,2,3]}'
          className="min-h-40 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" onClick={() => transform(false)} disabled={!input.trim()}>
          <AlignLeft />
          Format
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => transform(true)}
          disabled={!input.trim()}
        >
          <Minimize2 />
          Minify
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {output && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>Result</Label>
            <CopyButton value={output} />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
