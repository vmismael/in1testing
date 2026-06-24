"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_SLOT_TOOL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A single ad placement. When NEXT_PUBLIC_ADSENSE_CLIENT is configured it
 * renders a real AdSense unit; otherwise it shows a discreet placeholder in
 * development and renders nothing in production.
 */
export function AdSlot({
  slot = ADSENSE_SLOT_TOOL,
  className,
}: {
  slot?: string;
  className?: string;
}) {
  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore: AdSense script may still be loading.
    }
  }, []);

  if (!ADSENSE_CLIENT) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div
        className={cn(
          "flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground/60",
          className,
        )}
        aria-hidden="true"
      >
        Ad placeholder
      </div>
    );
  }

  return (
    <ins
      className={cn("adsbygoogle block", className)}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
