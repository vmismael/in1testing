"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
}

interface Picked {
  hex: string;
  rgb: string;
}

export default function ImageColorPickerTool({ tool }: { tool: Tool }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);

  async function pickFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    try {
      const img = await loadImage(file);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      setHasImage(true);
      setPicked(null);
    } catch {
      toast.error("Could not read this image.");
    }
  }

  function pick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const data = canvas.getContext("2d")?.getImageData(x, y, 1, 1).data;
    if (!data) return;
    setPicked({ hex: toHex(data[0], data[1], data[2]), rgb: `rgb(${data[0]}, ${data[1]}, ${data[2]})` });
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} onAdd={pickFile} hint="Any image · read privately in your browser" />

      <div className={hasImage ? "space-y-4" : "hidden"}>
        <p className="text-sm text-muted-foreground">Click anywhere on the image to pick a color.</p>
        <div className="overflow-auto rounded-xl border border-border bg-muted/30 p-2">
          <canvas ref={canvasRef} onClick={pick} className="mx-auto block max-w-full cursor-crosshair rounded" />
        </div>

        {picked && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <span className="size-12 shrink-0 rounded-lg border border-border" style={{ backgroundColor: picked.hex }} />
            <div className="flex items-center gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">HEX</Label>
                <p className="font-mono">{picked.hex}</p>
              </div>
              <CopyButton value={picked.hex} />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">RGB</Label>
                <p className="font-mono">{picked.rgb}</p>
              </div>
              <CopyButton value={picked.rgb} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
