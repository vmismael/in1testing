"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob } from "@/lib/download";
import { loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, yBase: number, maxWidth: number, canvasW: number) {
  if (!text) return;
  const fontSize = Math.round(canvasW / 12);
  ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.lineWidth = Math.max(2, fontSize / 14);
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#fff";
  const upper = text.toUpperCase();
  ctx.strokeText(upper, x, yBase, maxWidth);
  ctx.fillText(upper, x, yBase, maxWidth);
}

export default function MemeGeneratorTool({ tool }: { tool: Tool }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [hasImage, setHasImage] = useState(false);

  function render(t: string, b: string) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pad = canvas.height * 0.04;
    drawText(ctx, t, canvas.width / 2, pad + canvas.height / 12, canvas.width * 0.95, canvas.width);
    ctx.textBaseline = "alphabetic";
    drawText(ctx, b, canvas.width / 2, canvas.height - pad, canvas.width * 0.95, canvas.width);
  }

  async function pickFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    try {
      const img = await loadImage(file);
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setHasImage(true);
      render(top, bottom);
    } catch {
      toast.error("Could not read this image.");
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !hasImage) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "meme.png", "image/png");
    }, "image/png");
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} onAdd={pickFile} hint="Any image · captioned privately in your browser" />

      {hasImage && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meme-top">Top text</Label>
              <Input id="meme-top" value={top} onChange={(e) => { setTop(e.target.value); render(e.target.value, bottom); }} placeholder="ONE DOES NOT SIMPLY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meme-bottom">Bottom text</Label>
              <Input id="meme-bottom" value={bottom} onChange={(e) => { setBottom(e.target.value); render(top, e.target.value); }} placeholder="WALK INTO MORDOR" />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-border bg-muted/30 p-2">
            <canvas ref={canvasRef} className="mx-auto block max-w-full rounded" />
          </div>

          <Button type="button" size="lg" onClick={download}>
            <Download />
            Download meme
          </Button>
        </div>
      )}
    </div>
  );
}
