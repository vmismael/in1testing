"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function money(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PRESETS = [10, 15, 18, 20, 25];

export default function TipCalculatorTool() {
  const [bill, setBill] = useState("");
  const [tipPct, setTipPct] = useState(18);
  const [people, setPeople] = useState(1);

  const result = useMemo(() => {
    const b = parseFloat(bill);
    if (isNaN(b) || b < 0) return null;
    const tip = (b * tipPct) / 100;
    const total = b + tip;
    const n = Math.max(1, people);
    return { tip, total, perPersonTotal: total / n, perPersonTip: tip / n };
  }, [bill, tipPct, people]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tip-bill">Bill amount</Label>
          <Input id="tip-bill" type="number" value={bill} onChange={(e) => setBill(e.target.value)} placeholder="50.00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tip-people">Split between</Label>
          <Input id="tip-people" type="number" min={1} value={people} onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tip-pct">Tip ({tipPct}%)</Label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <Button key={p} type="button" size="sm" variant={tipPct === p ? "default" : "outline"} onClick={() => setTipPct(p)}>
              {p}%
            </Button>
          ))}
          <Input
            id="tip-pct"
            type="number"
            value={tipPct}
            onChange={(e) => setTipPct(Math.max(0, Number(e.target.value) || 0))}
            className="w-24"
          />
        </div>
      </div>

      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Tip amount</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{money(result.tip)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{money(result.total)}</p>
          </div>
          {people > 1 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Per person ({people})</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{money(result.perPersonTotal)}</p>
              <p className="mt-1 text-xs text-muted-foreground">includes {money(result.perPersonTip)} tip each</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
