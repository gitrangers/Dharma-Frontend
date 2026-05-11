const DEFAULT_API = "https://dharmacms2.tinglabs.in/";

export function getApiBase(): string {
  const u =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    DEFAULT_API;
  return u.endsWith("/") ? u : `${u}/`;
}

/** Sails / Angular responses often `{ data: T[] }` or `{ data: { data: T[] } }`. */
export function unwrapList(json: unknown): unknown[] {
  if (!json || typeof json !== "object") return [];
  const j = json as Record<string, unknown>;
  if (Array.isArray(j.data)) return j.data;
  const inner = j.data as Record<string, unknown> | undefined;
  if (inner && Array.isArray(inner.data)) return inner.data;
  return [];
}

export async function apiPost<T = unknown>(
  path: string,
  body: Record<string, unknown> = {},
  init?: RequestInit
): Promise<T> {
  const url = `${getApiBase()}${path.replace(/^\//, "")}`;
  const isServer = typeof window === "undefined";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
    body: JSON.stringify(body),
    credentials: isServer ? "omit" : "include",
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
