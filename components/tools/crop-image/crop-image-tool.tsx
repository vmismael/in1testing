"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { canvasToBlob, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const RATIOS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function CropImageTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Clean up object URLs to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function pickFile(files: File[]) {
    const f = files[0] ?? null;
    setResult(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
    setFile(f);
  }

  async function cropImage() {
    if (!file || !area) return;
    setBusy(true);
    try {
      const img = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(area.width));
      canvas.height = Math.max(1, Math.round(area.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");
      // JPG has no alpha channel: paint a white background first.
      if (file.type === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const type = file.type || "image/png";
      const blob = await canvasToBlob(canvas, type);
      const name = `${stripExtension(file.name)}-cropped.${EXT[type] ?? "png"}`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success("Image cropped.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not crop this image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone
        accept={tool.accept}
        disabled={busy}
        onAdd={pickFile}
        hint="JPG, PNG or WebP · processed privately in your browser"
      />

      {imageSrc && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="relative h-80 w-full overflow-hidden rounded-xl bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          </div>

          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            <div className="flex flex-wrap gap-2">
              {RATIOS.map((r) => (
                <Button
                  key={r.label}
                  type="button"
                  size="sm"
                  variant={aspect === r.value ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setAspect(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="crop-zoom">Zoom</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{zoom.toFixed(1)}×</span>
            </div>
            <Slider
              id="crop-zoom"
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              disabled={busy}
              onValueChange={(v) => setZoom(Array.isArray(v) ? v[0] : (v as number))}
            />
          </div>

          <Button type="button" size="lg" onClick={cropImage} disabled={busy || !area}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Cropping…" : "Crop image"}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Cropped preview"
                className="max-h-48 rounded-md border border-border object-contain"
              />
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download cropped image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
