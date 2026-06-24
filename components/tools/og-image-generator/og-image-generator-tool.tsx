"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown, Pipette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { downloadBlob } from "@/lib/download";

const W = 1200;
const H = 630;

const THEMES = [
  { key: "ink", label: "Ink", bg: "#0b0f14", fg: "#ffffff", accent: "#2997ff" },
  { key: "blue", label: "Blue", bg: "#0066cc", fg: "#ffffff", accent: "#bfe0ff" },
  { key: "paper", label: "Paper", bg: "#f5f5f7", fg: "#1d1d1f", accent: "#0066cc" },
  { key: "graphite", label: "Graphite", bg: "#1d1d1f", fg: "#f5f5f7", accent: "#2997ff" },
] as const;

const PRESET_COLORS = [
  { name: "Blue", hex: "#2997ff" },
  { name: "Indigo", hex: "#5856d6" },
  { name: "Purple", hex: "#af52de" },
  { name: "Pink", hex: "#ff2d55" },
  { name: "Red", hex: "#ff3b30" },
  { name: "Orange", hex: "#ff9500" },
  { name: "Yellow", hex: "#ffcc00" },
  { name: "Green", hex: "#34c759" },
  { name: "Teal", hex: "#30b0c7" },
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#1d1d1f" },
];

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export default function OgImageGeneratorTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("Your headline goes here");
  const [subtitle, setSubtitle] = useState("A short supporting line for context");
  const [label, setLabel] = useState("yoursite.com");
  const [theme, setTheme] = useState<string>("ink");
  const [accent, setAccent] = useState<string>(THEMES[0].accent);

  function pickTheme(key: string) {
    setTheme(key);
    const t = THEMES.find((x) => x.key === key);
    if (t) setAccent(t.accent);
  }

  const currentColorName =
    PRESET_COLORS.find((c) => c.hex.toLowerCase() === accent.toLowerCase())?.name ?? accent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const t = THEMES.find((x) => x.key === theme)!;

    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    // Accent bar
    ctx.fillStyle = accent;
    ctx.fillRect(80, 96, 64, 8);

    // Title
    ctx.fillStyle = t.fg;
    ctx.textBaseline = "top";
    ctx.font = '700 76px Inter, system-ui, sans-serif';
    const titleLines = wrap(ctx, title || " ", W - 160);
    let y = 150;
    for (const line of titleLines) {
      ctx.fillText(line, 80, y);
      y += 92;
    }

    // Subtitle
    ctx.fillStyle = t.fg;
    ctx.globalAlpha = 0.7;
    ctx.font = '400 36px Inter, system-ui, sans-serif';
    const subLines = wrap(ctx, subtitle || " ", W - 160).slice(0, 2);
    y += 12;
    for (const line of subLines) {
      ctx.fillText(line, 80, y);
      y += 50;
    }
    ctx.globalAlpha = 1;

    // Footer label
    ctx.fillStyle = accent;
    ctx.font = '600 28px Inter, system-ui, sans-serif';
    ctx.textBaseline = "bottom";
    ctx.fillText(label || "", 80, H - 72);
  }, [title, subtitle, label, theme, accent]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "og-image.png", "image/png");
    }, "image/png");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="og-title">Title</Label>
          <Input id="og-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="og-subtitle">Subtitle</Label>
          <Input id="og-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="og-label">Footer label</Label>
          <Input id="og-label" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <Button key={t.key} type="button" size="sm" variant={theme === t.key ? "default" : "outline"} onClick={() => pickTheme(t.key)}>
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Main color</Label>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm transition-colors hover:bg-muted/50 sm:w-auto">
              <span className="size-4 shrink-0 rounded border border-border" style={{ backgroundColor: accent }} />
              <span className="font-mono">{currentColorName}</span>
              <ChevronDown className="size-4 text-muted-foreground sm:ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {PRESET_COLORS.map((c) => (
                <DropdownMenuItem key={c.hex} onClick={() => setAccent(c.hex)}>
                  <span className="size-4 rounded border border-border" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => colorInputRef.current?.click()}>
                <Pipette className="size-4" />
                Choose from hex…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Hidden native picker, opened by the "Choose from hex" item. */}
          <input
            ref={colorInputRef}
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="pointer-events-none absolute size-0 opacity-0"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
      </div>

      <Button type="button" size="lg" onClick={download}>
        <Download />
        Download 1200×630 PNG
      </Button>
    </div>
  );
}
