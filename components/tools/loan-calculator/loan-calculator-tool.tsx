"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function money(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LoanCalculatorTool() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");

  const result = useMemo(() => {
    const p = parseFloat(amount);
    const annual = parseFloat(rate);
    const term = parseFloat(years);
    if (isNaN(p) || isNaN(annual) || isNaN(term) || p <= 0 || term <= 0) return null;
    const n = term * 12;
    const i = annual / 100 / 12;
    const payment = i === 0 ? p / n : (p * i) / (1 - Math.pow(1 + i, -n));
    const total = payment * n;
    return { payment, total, interest: total - p, n };
  }, [amount, rate, years]);

  const rows = result
    ? [
        { label: "Monthly payment", value: money(result.payment), big: true },
        { label: "Total of payments", value: money(result.total) },
        { label: "Total interest", value: money(result.interest) },
        { label: "Number of payments", value: String(result.n) },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="loan-amount">Loan amount</Label>
          <Input id="loan-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="20000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loan-rate">Annual interest rate (%)</Label>
          <Input id="loan-rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="6.5" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loan-years">Term (years)</Label>
          <Input id="loan-years" type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="5" />
        </div>
      </div>

      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className={`mt-1 font-semibold tabular-nums ${r.big ? "text-3xl" : "text-xl"}`}>{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
