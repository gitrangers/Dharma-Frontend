import "server-only";

import { getStrapiRestConfig } from "@/lib/server/movies/strapi";

function unwrapStrapiError(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const j = json as Record<string, unknown>;
  const err = j.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const m = (err as Record<string, unknown>).message;
    if (typeof m === "string") return m;
    if (Array.isArray(m) && m[0] && typeof m[0] === "object") {
      const x = (m[0] as Record<string, unknown>).message;
      if (typeof x === "string") return x;
    }
  }
  return "";
}

/** Strapi v4/v5 create response → stable string id for PATCH (prefer documentId). */
export function extractStrapiFormEntryId(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const root = json as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.documentId === "string" && d.documentId.trim()) return d.documentId.trim();
  if (d.id != null && String(d.id).trim()) return String(d.id).trim();
  const attrs = d.attributes;
  if (attrs && typeof attrs === "object") {
    const a = attrs as Record<string, unknown>;
    if (typeof a.documentId === "string" && a.documentId.trim()) return a.documentId.trim();
  }
  return "";
}

export type StrapiFormCreateInput = {
  firstName: string;
  lastName: string;
  email: string;
};

export type StrapiFormCreateResult =
  | { ok: true; id: string; raw: unknown }
  | { ok: false; error: string; status: number; raw?: unknown };

export async function strapiCreateFormEntry(input: StrapiFormCreateInput): Promise<StrapiFormCreateResult> {
  const { base, token } = getStrapiRestConfig();
  if (!base || !token) {
    return {
      ok: false,
      status: 503,
      error: "Strapi is not configured (set STRAPI_URL and STRAPI_API_TOKEN).",
    };
  }
  const url = `${base}/api/forms`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      },
    }),
    cache: "no-store",
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = unwrapStrapiError(raw) || `Strapi create failed (${res.status})`;
    return { ok: false, status: res.status >= 400 && res.status < 600 ? res.status : 502, error: msg, raw };
  }
  const id = extractStrapiFormEntryId(raw);
  if (!id) {
    return { ok: false, status: 502, error: "Strapi response missing entry id.", raw };
  }
  return { ok: true, id, raw };
}

export type StrapiFormScoreResult =
  | { ok: true; raw: unknown }
  | { ok: false; error: string; status: number; raw?: unknown };

export async function strapiUpdateFormScore(entryId: string, score: string): Promise<StrapiFormScoreResult> {
  const { base, token } = getStrapiRestConfig();
  if (!base || !token) {
    return {
      ok: false,
      status: 503,
      error: "Strapi is not configured (set STRAPI_URL and STRAPI_API_TOKEN).",
    };
  }
  const enc = encodeURIComponent(entryId);
  const url = `${base}/api/forms/${enc}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: { score },
    }),
    cache: "no-store",
  });
  const raw =
    res.status === 204 || res.headers.get("content-length") === "0" ?
      {}
    : await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = unwrapStrapiError(raw) || `Strapi update failed (${res.status})`;
    return { ok: false, status: res.status >= 400 && res.status < 600 ? res.status : 502, error: msg, raw };
  }
  return { ok: true, raw };
}
