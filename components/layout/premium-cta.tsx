"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Discreet lead-capture card shown on tool pages. Collects an email for future
 * premium/API offers. Posts to /api/leads (no-ops gracefully without Supabase).
 */
export function PremiumCta({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not subscribe.");
      }
      setDone(true);
      toast.success("Thanks! We'll keep you posted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 text-primary" aria-hidden="true" />
        Get more from In1
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Higher limits, batch processing and an API are on the way. Want early access?
      </p>
      {done ? (
        <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          You&apos;re on the list. 🎉
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <Button type="submit" variant="secondary" disabled={busy || !email}>
            Notify me
          </Button>
        </form>
      )}
    </div>
  );
}
