"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AudioLines, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { runConversion } from "@/lib/ffmpeg";
import type { Tool } from "@/lib/tools/types";

const MAX_BYTES = 50 * 1024 * 1024;

const FORMATS = [
  { label: "MP3", ext: "mp3", mime: "audio/mpeg", args: (i: string, o: string) => ["-i", i, "-b:a", "192k", o] },
  { label: "WAV", ext: "wav", mime: "audio/wav", args: (i: string, o: string) => ["-i", i, o] },
  { label: "OGG", ext: "ogg", mime: "audio/ogg", args: (i: string, o: string) => ["-i", i, "-c:a", "libvorbis", "-q:a", "5", o] },
  { label: "M4A", ext: "m4a", mime: "audio/mp4", args: (i: string, o: string) => ["-i", i, "-c:a", "aac", "-b:a", "192k", o] },
] as const;

type Ext = (typeof FORMATS)[number]["ext"];

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function AudioConverterTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [ext, setExt] = useState<Ext>("mp3");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function pickFile(files: File[]) {
    const f = files[0] ?? null;
    setResult(null);
    if (f && f.size > MAX_BYTES) {
      toast.warning(`Please use an audio file under ${formatBytes(MAX_BYTES)}.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  const format = FORMATS.find((f) => f.ext === ext)!;

  async function convert() {
    if (!file) return;
    setBusy(true);
    setProgress(null);
    setResult(null);
    try {
      const blob = await runConversion({
        file,
        outputName: `output.${format.ext}`,
        mime: format.mime,
        args: format.args,
        onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
      });
      const name = `${stripExtension(file.name)}.${format.ext}`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success(`Converted to ${format.label}.`);
    } catch (err) {
      console.error(err);
      toast.error("Could not convert this audio. Please try another file.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone
        accept={tool.accept}
        disabled={busy}
        onAdd={pickFile}
        hint="MP3, WAV, OGG, M4A and other audio files · processed privately on your device"
      />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>

          <div className="space-y-2">
            <Label>Convert to</Label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <Button
                  key={f.ext}
                  type="button"
                  size="sm"
                  variant={ext === f.ext ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setExt(f.ext)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <Button type="button" size="lg" onClick={convert} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <AudioLines />}
            {busy ? "Converting…" : `Convert to ${format.label}`}
          </Button>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {progress == null ? "Preparing…" : `Converting… ${progress}%`} The first run
                downloads the conversion engine; it&apos;s cached afterward.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <audio controls src={result.url} className="w-full">
                <track kind="captions" />
              </audio>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  {format.label}:{" "}
                  <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
                </span>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download {format.label}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
