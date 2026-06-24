export const siteConfig = {
  name: "In1",
  /** Used for <title> templates and the OpenGraph site name. */
  title: "In1 — Free Online Tools for PDF, Images & More",
  description:
    "In1 brings together dozens of fast, free online tools — merge and compress PDFs, resize images, shorten links and more. No sign-up, no watermarks, and mostly right in your browser.",
  /** Absolute base URL. Set NEXT_PUBLIC_SITE_URL in production. */
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000",
  tagline: "Every tool you need, all in one place.",
  locale: "en_US",
} as const;

/** Returns an absolute URL for the given path, using the configured site URL. */
export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}
