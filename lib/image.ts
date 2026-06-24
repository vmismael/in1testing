/**
 * Canvas helpers shared by the client-side image tools (converter, resizer and
 * future crop / background tools). Everything runs in the browser — files are
 * never uploaded.
 */

/** Decodes a File into an HTMLImageElement, cleaning up its object URL. */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image. Is the file valid?"));
    };
    img.src = url;
  });
}

interface DrawOptions {
  /** Target width in pixels. Defaults to the image's natural width. */
  width?: number;
  /** Target height in pixels. Defaults to the image's natural height. */
  height?: number;
  /** Solid background painted before the image — use for JPEG (no alpha). */
  background?: string;
}

/** Draws an image onto a fresh canvas at the given pixel dimensions. */
export function drawToCanvas(img: HTMLImageElement, options: DrawOptions = {}): HTMLCanvasElement {
  const width = Math.max(1, Math.round(options.width ?? img.naturalWidth));
  const height = Math.max(1, Math.round(options.height ?? img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/** Exports a canvas to a Blob of the given MIME type and quality (0–1). */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export the image."))),
      type,
      quality,
    );
  });
}
