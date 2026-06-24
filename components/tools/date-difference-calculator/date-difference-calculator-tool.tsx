"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function diffYMD(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export default function DateDifferenceCalculatorTool() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const result = useMemo(() => {
    if (!start || !end) return null;
    let from = new Date(start + "T00:00:00");
    let to = new Date(end + "T00:00:00");
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
    if (from > to) [from, to] = [to, from];
    const { years, months, days } = diffYMD(from, to);
    const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000);
    return { years, months, days, totalDays, totalWeeks: Math.floor(totalDays / 7), totalMonths: years * 12 + months };
  }, [start, end]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dd-start">Start date</Label>
          <Input id="dd-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dd-end">End date</Label>
          <Input id="dd-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Difference</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {result.years} <span className="text-base font-normal text-muted-foreground">y</span> {result.months}{" "}
              <span className="text-base font-normal text-muted-foreground">m</span> {result.days}{" "}
              <span className="text-base font-normal text-muted-foreground">d</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Total months", value: result.totalMonths },
              { label: "Total weeks", value: result.totalWeeks },
              { label: "Total days", value: result.totalDays },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xl font-semibold tabular-nums">{m.value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
