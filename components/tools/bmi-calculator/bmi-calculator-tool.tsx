"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function category(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-amber-600" };
  if (bmi < 25) return { label: "Normal weight", color: "text-emerald-600" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-600" };
  return { label: "Obese", color: "text-rose-600" };
}

export default function BmiCalculatorTool() {
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [height, setHeight] = useState(""); // cm or inches
  const [weight, setWeight] = useState(""); // kg or lb

  const result = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return null;
    const bmi = units === "metric" ? w / Math.pow(h / 100, 2) : (w / (h * h)) * 703;
    return { bmi, ...category(bmi) };
  }, [height, weight, units]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={units === "metric" ? "default" : "outline"} onClick={() => setUnits("metric")}>
          Metric (cm, kg)
        </Button>
        <Button type="button" size="sm" variant={units === "imperial" ? "default" : "outline"} onClick={() => setUnits("imperial")}>
          Imperial (in, lb)
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bmi-height">Height ({units === "metric" ? "cm" : "inches"})</Label>
          <Input id="bmi-height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder={units === "metric" ? "175" : "69"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bmi-weight">Weight ({units === "metric" ? "kg" : "lb"})</Label>
          <Input id="bmi-weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={units === "metric" ? "70" : "154"} />
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Your BMI</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{result.bmi.toFixed(1)}</p>
          <p className={`mt-1 text-sm font-medium ${result.color}`}>{result.label}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            BMI is a general screening tool and does not account for muscle mass, age or body composition. It is not a diagnosis.
          </p>
        </div>
      )}
    </div>
  );
}
