import "server-only";

/** @param {string | undefined} s */
function trim(s) {
  return (s ?? "").trim();
}

/** @param {string | undefined} raw */
function normalizeEnvToken(raw) {
  let s = (raw ?? "").trim();
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
function strapiBearerToken() {
  return (
    normalizeEnvToken(process.env.STRAPI_API_TOKEN) ||
    normalizeEnvToken(process.env.STRAPI_AUTH_TOKEN) ||
    normalizeEnvToken(process.env.STRAPI_TOKEN)
  );
}

/**
 * Cached `fetch` with ISR-style revalidation (seconds).
 * Sets `Accept: application/json` and `Bearer` auth when `STRAPI_API_TOKEN` /
 * `STRAPI_AUTH_TOKEN` / `STRAPI_TOKEN` is set.
 *
 * @param {string} url
 * @param {number} [revalidateSeconds]
 * @param {RequestInit} [init] Merged after defaults (`headers` / `next` shallow-merged).
 * @returns {Promise<Response>}
 */
export async function fetchWithRevalidate(url, revalidateSeconds = 60, init = {}) {
  const { headers: initHeaders, next: initNext, ...rest } = init;
  const extra =
    initHeaders && typeof initHeaders === "object" && !Array.isArray(initHeaders)
      ? /** @type {Record<string, string>} */ (initHeaders)
      : {};
  const headers = { Accept: "application/json", ...extra };
  const token = strapiBearerToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  const next = {
    ...(typeof initNext === "object" && initNext && !Array.isArray(initNext) ? initNext : {}),
    revalidate: revalidateSeconds,
  };
  return fetch(url, { ...rest, headers, next });
}

/**
 * JSON `GET` (or method from `init`) with ISR cache; throws on non-OK response.
 * Use only from Server Components, Route Handlers, or other server-only modules.
 *
 * @template [T=unknown]
 * @param {string} url
 * @param {number} [revalidateSeconds]
 * @param {RequestInit} [init]
 * @returns {Promise<T>}
 */
export async function fetchJsonWithRevalidate(url, revalidateSeconds = 60, init = {}) {
  const res = await fetchWithRevalidate(url, revalidateSeconds, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return /** @type {Promise<T>} */ (res.json());
}
