"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UrlShortenerTool() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function shorten(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setShortUrl(null);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setShortUrl(data.shortUrl);
      toast.success("Short link created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not shorten this URL.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={shorten} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="url"
          required
          inputMode="url"
          placeholder="https://example.com/your/very/long/link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={busy}
          className="h-11 flex-1"
        />
        <Button type="submit" size="lg" className="h-11" disabled={busy || !url}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Shortening…" : "Shorten"}
        </Button>
      </form>

      {shortUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate font-medium text-primary underline-offset-4 hover:underline"
          >
            {shortUrl}
          </a>
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  );
}
