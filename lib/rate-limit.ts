import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/**
 * Per-IP rate limiting backed by Upstash Redis (durable across serverless
 * instances, unlike an in-memory map). If the Upstash env vars are absent
 * — local dev or an unconfigured deploy — limiting is skipped gracefully so
 * nothing breaks; it just isn't enforced.
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, max: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters.get(name);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      prefix: `in1:rl:${name}`,
      analytics: false,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}

interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

/**
 * Returns `{ ok: false, retryAfter }` when the caller has exceeded `max`
 * requests in `windowSeconds`. Always `ok` when limiting is disabled.
 */
export async function checkRateLimit(
  name: string,
  identifier: string,
  max: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, max, windowSeconds);
  if (!limiter) return { ok: true, retryAfter: 0 };

  const { success, reset } = await limiter.limit(identifier);
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return { ok: success, retryAfter };
}

/** A 429 response with a `Retry-After` header. */
export function rateLimitedResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/**
 * Guards a JSON POST: rejects a non-JSON Content-Type (415) and an oversized
 * body (413, from the Content-Length header). Returns an error response to
 * short-circuit with, or `null` when the request is acceptable.
 */
export function guardJsonRequest(request: Request, maxBytes = 10_240): NextResponse | null {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Expected application/json." },
      { status: 415 },
    );
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > maxBytes) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  return null;
}
