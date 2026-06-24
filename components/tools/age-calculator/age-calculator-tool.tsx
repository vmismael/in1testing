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
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export default function AgeCalculatorTool() {
  const [birth, setBirth] = useState("");
  // Captured once at mount; tool is client-only (ssr:false).
  const [today] = useState(() => new Date());

  const result = useMemo(() => {
    if (!birth) return null;
    const from = new Date(birth + "T00:00:00");
    if (isNaN(from.getTime()) || from > today) return null;
    const { years, months, days } = diffYMD(from, today);
    const totalDays = Math.floor((today.getTime() - from.getTime()) / 86400000);
    return { years, months, days, totalDays, totalWeeks: Math.floor(totalDays / 7), totalMonths: years * 12 + months };
  }, [birth, today]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="age-birth">Date of birth</Label>
        <Input id="age-birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="max-w-xs" />
      </div>

      {result && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Your age</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {result.years} <span className="text-base font-normal text-muted-foreground">years</span> {result.months}{" "}
              <span className="text-base font-normal text-muted-foreground">months</span> {result.days}{" "}
              <span className="text-base font-normal text-muted-foreground">days</span>
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
