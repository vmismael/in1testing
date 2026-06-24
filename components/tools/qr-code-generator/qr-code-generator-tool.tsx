"use client";

import { useRef, useState } from "react";
import * as QRCode from "qrcode";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob } from "@/lib/download";

const SIZE = 256;

export default function QrCodeGeneratorTool() {
  const [value, setValue] = useState("");
  const [hasCode, setHasCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function render(text: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!text.trim()) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      setHasCode(false);
      setError(null);
      return;
    }
    try {
      await QRCode.toCanvas(canvas, text, { width: SIZE, margin: 2 });
      setHasCode(true);
      setError(null);
    } catch {
      setHasCode(false);
      setError("Could not generate a QR code for this input — it may be too long.");
    }
  }

  function changeValue(next: string) {
    setValue(next);
    render(next);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !hasCode) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Could not export the QR code.");
        return;
      }
      downloadBlob(blob, "qr-code.png", "image/png");
    }, "image/png");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="qr-input">Text or URL</Label>
        <Input
          id="qr-input"
          value={value}
          onChange={(e) => changeValue(e.target.value)}
          placeholder="https://example.com"
          className="h-11"
        />
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/30 p-6">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className={hasCode ? "rounded-lg bg-white" : "hidden"}
        />
        {!hasCode && !error && (
          <p className="py-10 text-sm text-muted-foreground">Your QR code will appear here.</p>
        )}
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="button" size="lg" onClick={download} disabled={!hasCode}>
          <Download />
          Download PNG
        </Button>
      </div>
    </div>
  );
}
