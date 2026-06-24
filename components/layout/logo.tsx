import { cn } from "@/lib/utils";

/**
 * The In1 wordmark. The letters inherit the surrounding text color (white on the
 * dark header/footer); the trailing dot uses Sky Link Blue, which stays vivid on
 * dark surfaces (see DESIGN-apple.md). Single source of truth for the logo.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("text-2xl font-semibold tracking-tight", className)}>
      In1<span className="text-[#2997ff]">.</span>
    </span>
  );
}
