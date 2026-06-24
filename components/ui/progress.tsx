import { cn } from "@/lib/utils";

/**
 * Minimal progress bar. Pass a value (0–100) for a determinate bar, or omit it
 * (null/undefined) for an indeterminate, pulsing state. Used by the WASM/AI tools
 * (background remover, ffmpeg) for model download / processing feedback.
 */
export function Progress({ value, className }: { value?: number | null; className?: string }) {
  const pct = value == null ? null : Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-all",
          pct == null && "w-1/3 animate-pulse",
        )}
        style={pct == null ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
}
