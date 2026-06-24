"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

type Mode = "encode" | "decode";

/** UTF-8-safe Base64 encode (handles accents, emoji and other non-ASCII). */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** UTF-8-safe Base64 decode. Throws if the input isn't valid Base64. */
function decodeBase64(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function convert(nextMode: Mode, value: string) {
    if (!value) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      setOutput(nextMode === "encode" ? encodeBase64(value) : decodeBase64(value));
      setError(null);
    } catch {
      setOutput("");
      setError(
        nextMode === "decode"
          ? "This doesn't look like valid Base64. Check the string and try again."
          : "Could not encode this text.",
      );
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    convert(next, input);
  }

  function changeInput(value: string) {
    setInput(value);
    convert(mode, value);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "encode" ? "default" : "outline"}
            onClick={() => changeMode("encode")}
          >
            Encode
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "decode" ? "default" : "outline"}
            onClick={() => changeMode("decode")}
          >
            Decode
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base64-input">{mode === "encode" ? "Text" : "Base64"}</Label>
        <Textarea
          id="base64-input"
          value={input}
          onChange={(e) => changeInput(e.target.value)}
          placeholder={mode === "encode" ? "Type or paste text to encode…" : "Paste Base64 to decode…"}
          className="min-h-32 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {output && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label>{mode === "encode" ? "Base64" : "Text"}</Label>
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
