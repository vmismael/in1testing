import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge proxy (Next 16's renamed middleware): blocks common probe paths, adds a
 * lightweight CSRF origin-check to the API routes, and tags every request with
 * an id.
 *
 * The matcher (bottom) excludes Next's static assets, the image optimizer and
 * files with an extension, so it never sits in front of the WASM workers,
 * fonts or images the tools rely on.
 */

// Paths scanners probe for; we 404 them outright.
const BLOCKED_PATHS = new Set([
  "/.env",
  "/.env.local",
  "/.git",
  "/wp-admin",
  "/wp-login.php",
  "/phpmyadmin",
  "/xmlrpc.php",
  "/admin",
]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BLOCKED_PATHS.has(pathname.toLowerCase())) {
    return new NextResponse(null, { status: 404 });
  }

  // CSRF guard: a state-changing call to /api/* must originate from this site.
  // Only enforced when an Origin header is present (browsers always send one
  // for cross-origin and fetch POSTs); server-to-server callers without it
  // are not blocked here.
  if (pathname.startsWith("/api/") && MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Request-Id", crypto.randomUUID());
  return response;
}

export const config = {
  // Run on everything except Next internals and static files (anything with a
  // file extension). Keeps the tools' workers/wasm/fonts/images untouched.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
