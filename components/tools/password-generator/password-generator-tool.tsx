"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CopyButton } from "@/components/ui/copy-button";

const SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
} as const;

type SetKey = keyof typeof SETS;
type Enabled = Record<SetKey, boolean>;

const OPTIONS: { key: SetKey; label: string }[] = [
  { key: "uppercase", label: "Uppercase" },
  { key: "lowercase", label: "Lowercase" },
  { key: "numbers", label: "Numbers" },
  { key: "symbols", label: "Symbols" },
];

const DEFAULT_ENABLED: Enabled = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

/** Secure random integer in [0, max) using the Web Crypto API. */
function randomIndex(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

/** Returns a freshly generated password, or null if no character set is enabled. */
function buildPassword(length: number, enabled: Enabled): string | null {
  const pools = OPTIONS.filter((o) => enabled[o.key]).map((o) => SETS[o.key]);
  if (pools.length === 0) return null;
  const all = pools.join("");
  const chars: string[] = [];
  // Guarantee at least one character from every enabled set.
  for (const pool of pools) chars.push(pool[randomIndex(pool.length)]);
  for (let i = chars.length; i < length; i++) chars.push(all[randomIndex(all.length)]);
  // Fisher–Yates shuffle so the guaranteed characters aren't always up front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join("");
}

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<Enabled>(DEFAULT_ENABLED);
  const [password, setPassword] = useState(() => buildPassword(16, DEFAULT_ENABLED) ?? "");

  function regenerate(nextLength: number, nextEnabled: Enabled) {
    const result = buildPassword(nextLength, nextEnabled);
    if (result === null) {
      setPassword("");
      toast.warning("Select at least one character type.");
      return;
    }
    setPassword(result);
  }

  function changeLength(value: number | readonly number[]) {
    const next = Array.isArray(value) ? value[0] : (value as number);
    setLength(next);
    regenerate(next, enabled);
  }

  function toggle(key: SetKey) {
    const next = { ...enabled, [key]: !enabled[key] };
    setEnabled(next);
    regenerate(length, next);
  }

  const noneSelected = OPTIONS.every((o) => !enabled[o.key]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <Input
          readOnly
          value={password}
          placeholder="Select options to generate a password"
          className="h-11 flex-1 font-mono text-base"
          aria-label="Generated password"
        />
        <CopyButton value={password} size="default" className="h-11" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password-length">Length</Label>
          <span className="text-sm tabular-nums text-muted-foreground">{length}</span>
        </div>
        <Slider id="password-length" min={6} max={64} value={[length]} onValueChange={changeLength} />
      </div>

      <div className="space-y-2">
        <Label>Include</Label>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <Button
              key={o.key}
              type="button"
              size="sm"
              variant={enabled[o.key] ? "default" : "outline"}
              onClick={() => toggle(o.key)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </div>

      <Button type="button" size="lg" onClick={() => regenerate(length, enabled)} disabled={noneSelected}>
        <RefreshCw />
        Generate
      </Button>
    </div>
  );
}
