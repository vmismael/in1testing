"use client";

import { useRef, useState } from "react";
import SparkMD5 from "spark-md5";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";

type Hashes = { md5: string; sha1: string; sha256: string; sha512: string };

const ALGOS: { label: string; key: keyof Hashes }[] = [
  { label: "MD5", key: "md5" },
  { label: "SHA-1", key: "sha1" },
  { label: "SHA-256", key: "sha256" },
  { label: "SHA-512", key: "sha512" },
];

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha(algo: AlgorithmIdentifier, bytes: BufferSource): Promise<string> {
  return toHex(await crypto.subtle.digest(algo, bytes));
}

export default function HashGeneratorTool() {
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<Hashes | null>(null);
  const latest = useRef("");

  async function compute(value: string) {
    const bytes = new Uint8Array(new TextEncoder().encode(value));
    const md5 = SparkMD5.ArrayBuffer.hash(bytes.buffer);
    const [sha1, sha256, sha512] = await Promise.all([
      sha("SHA-1", bytes),
      sha("SHA-256", bytes),
      sha("SHA-512", bytes),
    ]);
    // Ignore stale results if the input changed while we were hashing.
    if (latest.current === value) setHashes({ md5, sha1, sha256, sha512 });
  }

  function change(value: string) {
    setText(value);
    latest.current = value;
    if (!value) {
      setHashes(null);
      return;
    }
    void compute(value);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hash-input">Your text</Label>
        <Textarea
          id="hash-input"
          value={text}
          onChange={(e) => change(e.target.value)}
          placeholder="Type or paste text to hash…"
          className="min-h-28"
        />
      </div>

      {hashes && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          {ALGOS.map((a) => (
            <div key={a.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{a.label}</span>
                <CopyButton value={hashes[a.key]} />
              </div>
              <code className="block break-all text-sm">{hashes[a.key]}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
