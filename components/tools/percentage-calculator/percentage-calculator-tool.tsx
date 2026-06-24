"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MODES = [
  { key: "of", label: "X% of Y" },
  { key: "isWhat", label: "X is what % of Y" },
  { key: "change", label: "% change" },
] as const;
type ModeKey = (typeof MODES)[number]["key"];

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  return Number(n.toFixed(4)).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function PercentageCalculatorTool() {
  const [mode, setMode] = useState<ModeKey>("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const result = useMemo(() => {
    const x = parseFloat(a);
    const y = parseFloat(b);
    if (isNaN(x) || isNaN(y)) return null;
    if (mode === "of") return { label: `${fmt(x)}% of ${fmt(y)} is`, value: fmt((x / 100) * y) };
    if (mode === "isWhat") return { label: `${fmt(x)} is this % of ${fmt(y)}`, value: y === 0 ? "—" : `${fmt((x / y) * 100)}%` };
    return { label: `Change from ${fmt(x)} to ${fmt(y)}`, value: x === 0 ? "—" : `${fmt(((y - x) / Math.abs(x)) * 100)}%` };
  }, [mode, a, b]);

  const labels = mode === "of"
    ? { a: "Percentage (X)", b: "Of value (Y)" }
    : mode === "isWhat"
      ? { a: "Value (X)", b: "Total (Y)" }
      : { a: "From (X)", b: "To (Y)" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Button key={m.key} type="button" size="sm" variant={mode === m.key ? "default" : "outline"} onClick={() => setMode(m.key)}>
            {m.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pc-a">{labels.a}</Label>
          <Input id="pc-a" type="number" value={a} onChange={(e) => setA(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pc-b">{labels.b}</Label>
          <Input id="pc-b" type="number" value={b} onChange={(e) => setB(e.target.value)} placeholder="0" />
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{result.label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{result.value}</p>
        </div>
      )}
    </div>
  );
}
