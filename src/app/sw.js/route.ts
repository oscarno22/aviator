import { readFileSync } from "node:fs";
import { join } from "node:path";

// Rendered once at build time. Headers for /sw.js (no-store, JS content type)
// come from next.config.ts.
export const dynamic = "force-static";

/**
 * The service worker, stamped with a per-deploy version. A byte change in
 * /sw.js is what makes browsers install the new worker, which rebuilds the
 * offline precache and deletes the previous deploy's caches.
 */
export function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? String(Date.now());
  const source = readFileSync(join(process.cwd(), "src/sw/sw.template.js"), "utf8")
    .replace('"__CACHE_VERSION__"', JSON.stringify(version));
  return new Response(source, {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}
