import * as pdfjs from "pdfjs-dist";

/**
 * pdf.js needs a web worker. The `new URL(..., import.meta.url)` pattern lets the
 * bundler (Turbopack) emit the worker as a static asset and hand us its URL.
 * This module is only imported by client-only tools, so it runs in the browser.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export { pdfjs };
