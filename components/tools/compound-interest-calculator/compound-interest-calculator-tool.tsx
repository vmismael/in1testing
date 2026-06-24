"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function money(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const FREQS = [
  { key: 1, label: "Yearly" },
  { key: 4, label: "Quarterly" },
  { key: 12, label: "Monthly" },
  { key: 365, label: "Daily" },
] as const;

export default function CompoundInterestCalculatorTool() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [freq, setFreq] = useState<number>(12);
  const [contribution, setContribution] = useState("");

  const result = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate);
    const t = parseFloat(years);
    const pmt = parseFloat(contribution) || 0; // monthly contribution
    if (isNaN(r) || isNaN(t) || t <= 0) return null;

    const i = r / 100 / freq;
    const n = freq * t;
    // Future value of principal
    const fvPrincipal = i === 0 ? p : p * Math.pow(1 + i, n);
    // Future value of contributions (made monthly, approximated at compounding cadence)
    const totalMonths = 12 * t;
    const monthlyRate = r / 100 / 12;
    const fvContrib = monthlyRate === 0 ? pmt * totalMonths : pmt * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

    const total = fvPrincipal + fvContrib;
    const invested = p + pmt * totalMonths;
    return { total, invested, interest: total - invested };
  }, [principal, rate, years, freq, contribution]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ci-principal">Initial amount</Label>
          <Input id="ci-principal" type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="1000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ci-contribution">Monthly contribution</Label>
          <Input id="ci-contribution" type="number" value={contribution} onChange={(e) => setContribution(e.target.value)} placeholder="100" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ci-rate">Annual interest rate (%)</Label>
          <Input id="ci-rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="7" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ci-years">Years</Label>
          <Input id="ci-years" type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="10" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Compounding frequency</Label>
        <div className="flex flex-wrap gap-2">
          {FREQS.map((f) => (
            <Button key={f.key} type="button" size="sm" variant={freq === f.key ? "default" : "outline"} onClick={() => setFreq(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4 sm:col-span-3">
            <p className="text-xs text-muted-foreground">Future value</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{money(result.total)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Total invested</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{money(result.invested)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Interest earned</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-primary">{money(result.interest)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
