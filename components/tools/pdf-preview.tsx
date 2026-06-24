"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canvasToBlob } from "@/lib/image";
import { pdfjs } from "@/lib/pdfjs";

const PREVIEW_WIDTH = 400;

/**
 * Reusable multi-page preview for a result PDF. Renders the current page to an
 * image via pdf.js, with prev/next navigation (pages are rendered on demand).
 * Pass the PDF as a Blob (a File works too). All state updates happen after an
 * await, so the effect never sets state synchronously.
 */
export function PdfPreview({ blob }: { blob: Blob }) {
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const docRef = useRef<PDFDocumentProxy | null>(null);
  const taskRef = useRef<ReturnType<typeof pdfjs.getDocument> | null>(null);
  const urlRef = useRef<string | null>(null);

  const showUrl = useCallback((next: string) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next;
    setUrl(next);
  }, []);

  const render = useCallback(
    async (doc: PDFDocumentProxy, p: number) => {
      const pg = await doc.getPage(p);
      const base = pg.getViewport({ scale: 1 });
      const viewport = pg.getViewport({ scale: PREVIEW_WIDTH / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await pg.render({ canvas, viewport, background: "#ffffff" }).promise;
      pg.cleanup();
      showUrl(URL.createObjectURL(await canvasToBlob(canvas, "image/jpeg", 0.8)));
    },
    [showUrl],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const task = pdfjs.getDocument({ data: await blob.arrayBuffer() });
        taskRef.current = task;
        const doc = await task.promise;
        if (cancelled) return;
        docRef.current = doc;
        setPageCount(doc.numPages);
        setPage(1);
        await render(doc, 1);
      } catch {
        // Ignore — an invalid/unsupported PDF simply shows no preview.
      }
    })();
    return () => {
      cancelled = true;
      taskRef.current?.destroy().catch(() => {});
      taskRef.current = null;
      docRef.current = null;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [blob, render]);

  async function go(delta: number) {
    const doc = docRef.current;
    if (!doc || busy) return;
    const next = Math.min(pageCount, Math.max(1, page + delta));
    if (next === page) return;
    setPage(next);
    setBusy(true);
    try {
      await render(doc, next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-border bg-muted/40 p-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`Page ${page} preview`}
            className="max-h-96 w-auto rounded border border-border shadow-sm"
          />
        ) : (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={busy || page <= 1}
            aria-label="Previous page"
            onClick={() => go(-1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={busy || page >= pageCount}
            aria-label="Next page"
            onClick={() => go(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
