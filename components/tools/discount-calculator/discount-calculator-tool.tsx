"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function money(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PRESETS = [10, 15, 20, 25, 50];

export default function DiscountCalculatorTool() {
  const [price, setPrice] = useState("");
  const [pct, setPct] = useState(20);

  const result = useMemo(() => {
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) return null;
    const saved = (p * pct) / 100;
    return { saved, final: p - saved };
  }, [price, pct]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="disc-price">Original price</Label>
        <Input id="disc-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80.00" className="max-w-xs" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="disc-pct">Discount ({pct}%)</Label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <Button key={p} type="button" size="sm" variant={pct === p ? "default" : "outline"} onClick={() => setPct(p)}>
              {p}%
            </Button>
          ))}
          <Input
            id="disc-pct"
            type="number"
            value={pct}
            onChange={(e) => setPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="w-24"
          />
        </div>
      </div>

      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Final price</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">{money(result.final)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">You save</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{money(result.saved)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
