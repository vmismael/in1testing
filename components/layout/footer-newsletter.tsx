"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Footer email signup. Reuses the /api/leads endpoint (source: "footer"). */
export function FooterNewsletter() {
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
        body: JSON.stringify({ email, source: "footer" }),
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
    <div>
      <p className="text-sm font-semibold">Subscribe</p>
      <p className="mt-2 text-sm text-white/60">
        Get updates on new tools and features.
      </p>

      {done ? (
        <p className="mt-4 text-sm font-medium text-white/90">You&apos;re on the list. 🎉</p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex items-end gap-3">
          <input
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="min-w-0 flex-1 border-b border-white/25 bg-transparent pb-1.5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/60"
          />
          <Button type="submit" variant="secondary" disabled={busy || !email}>
            Subscribe
          </Button>
        </form>
      )}

      <p className="mt-3 text-xs text-white/40">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
