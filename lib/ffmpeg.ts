import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

/**
 * Single-thread ffmpeg.wasm loader (singleton).
 *
 * IMPORTANT: we use the SINGLE-THREAD core (`@ffmpeg/core`, not `-mt`). The
 * multi-thread core needs SharedArrayBuffer, which requires cross-origin
 * isolation (COOP/COEP) — and those headers break Google AdSense and analytics.
 * Never switch to the mt core or add those headers. Slower, but ads keep working.
 *
 * The core is loaded from a pinned CDN via `toBlobURL` so we don't have to bundle
 * the ~30 MB wasm. The @ffmpeg/ffmpeg worker is bundled by Turbopack via the
 * library's internal `new URL("./worker.js", import.meta.url)`. If that ever
 * breaks, pass `classWorkerURL` (a toBlobURL of the UMD worker) to `load()`.
 */
const CORE_VERSION = "0.12.10";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

/** Returns the singleton FFmpeg instance (not necessarily loaded yet). */
export function getFFmpeg(): FFmpeg {
  if (!ffmpeg) ffmpeg = new FFmpeg();
  return ffmpeg;
}

/** Loads the single-thread core once and caches it. Safe to call repeatedly. */
export function loadFFmpeg(): Promise<FFmpeg> {
  const instance = getFFmpeg();
  if (instance.loaded) return Promise.resolve(instance);
  if (!loadPromise) {
    loadPromise = (async () => {
      await instance.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return instance;
    })().catch((err) => {
      // Allow a retry after a failed load (e.g. CDN hiccup).
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
}

interface ConversionOptions {
  file: File;
  /** Output filename inside the ffmpeg FS, e.g. "output.mp3". */
  outputName: string;
  /** Builds the ffmpeg argument list given the input and output filenames. */
  args: (input: string, output: string) => string[];
  /** MIME type for the resulting Blob. */
  mime: string;
  /** Conversion progress as a 0–1 ratio (not reported during the model load). */
  onProgress?: (ratio: number) => void;
}

/**
 * Runs a single ffmpeg conversion end to end: loads the core (once), writes the
 * input, executes, reads the output and cleans up the in-memory FS. Returns the
 * result as a Blob. Listeners are added and removed per call so they never stack.
 */
export async function runConversion({
  file,
  outputName,
  args,
  mime,
  onProgress,
}: ConversionOptions): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const srcExt = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const input = `input-${Date.now()}.${srcExt}`;

  const handler = ({ progress }: { progress: number }) =>
    onProgress?.(Math.min(1, Math.max(0, progress)));
  if (onProgress) ffmpeg.on("progress", handler);

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));
    await ffmpeg.exec(args(input, outputName));
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    return new Blob([new Uint8Array(data)], { type: mime });
  } finally {
    if (onProgress) ffmpeg.off("progress", handler);
    await ffmpeg.deleteFile(input).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
