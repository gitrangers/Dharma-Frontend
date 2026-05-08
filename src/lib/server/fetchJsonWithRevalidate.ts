import "server-only";

function trim(s: string | undefined): string {
  return (s ?? "").trim();
}

function normalizeEnvToken(raw: string | undefined): string {
  let s = trim(raw);
  if (!s) return "";
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (/^Bearer\s+/i.test(s)) {
    s = s.replace(/^Bearer\s+/i, "").trim();
  }
  return s.replace(/[\s\r\n]+/g, "");
}

/** Same token resolution as `server/movies/strapi.js`. */
function strapiBearerToken(): string {
  return (
    normalizeEnvToken(process.env.STRAPI_API_TOKEN) ||
    normalizeEnvToken(process.env.STRAPI_AUTH_TOKEN) ||
    normalizeEnvToken(process.env.STRAPI_TOKEN)
  );
}

/**
 * Cached `fetch` with ISR-style revalidation (seconds).
 * Use only from Server Components, Route Handlers, or other server-only modules.
 */
export async function fetchJsonWithRevalidate<T = unknown>(
  url: string,
  revalidateSeconds = 60,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = strapiBearerToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    next: { revalidate: revalidateSeconds },
    headers,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return res.json() as Promise<T>;
}
