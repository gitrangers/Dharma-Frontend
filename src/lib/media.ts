import { getApiBase } from "@/lib/api";

function trimBase(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

function toRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

/**
 * Flatten Strapi populate `image` / `banner` into a URL or stored file key string
 * (matches `pickMediaUrl` on the news list page).
 */
export function pickStrapiMediaUrl(media: unknown): string {
  if (!media) return "";
  if (typeof media === "string") return media.trim();
  if (Array.isArray(media)) {
    return media.length ? pickStrapiMediaUrl(media[0]) : "";
  }
  if (typeof media !== "object") return "";
  const top = toRecord(media);
  if (!top) return "";
  if (typeof top.url === "string" && top.url.trim()) return top.url.trim();
  const formats = toRecord(top.formats);
  const f =
    (formats && toRecord(formats.small)) ||
    (formats && toRecord(formats.medium)) ||
    (formats && toRecord(formats.large)) ||
    (formats && toRecord(formats.thumbnail));
  if (typeof f?.url === "string" && f.url.trim()) return f.url.trim();
  if (Array.isArray(top.data)) {
    return top.data.length ? pickStrapiMediaUrl(top.data[0]) : "";
  }
  const inner = toRecord(top.data);
  if (typeof inner?.url === "string" && inner.url.trim()) return inner.url.trim();
  const attrs = toRecord(inner?.attributes);
  if (typeof attrs?.url === "string" && attrs.url.trim()) return attrs.url.trim();
  const attrsFormats = toRecord(attrs?.formats);
  const af =
    (attrsFormats && toRecord(attrsFormats.small)) ||
    (attrsFormats && toRecord(attrsFormats.medium)) ||
    (attrsFormats && toRecord(attrsFormats.large)) ||
    (attrsFormats && toRecord(attrsFormats.thumbnail));
  if (typeof af?.url === "string" && af.url.trim()) return af.url.trim();
  return "";
}

/**
 * Origin exposed to the browser (for relative `/uploads/...`).
 * Prefer `.env`: NEXT_PUBLIC_STRAPI_ASSETS_URL, then NEXT_PUBLIC_IMAGE_URL, then NEXT_PUBLIC_STRAPI_URL.
 */
export function publicCmsAssetOrigin(): string {
  return (
    trimBase(process.env.NEXT_PUBLIC_STRAPI_ASSETS_URL) ||
    trimBase(process.env.NEXT_PUBLIC_IMAGE_URL) ||
    trimBase(process.env.NEXT_PUBLIC_STRAPI_URL) ||
    ""
  );
}

/**
 * Server-side absolute media host (RSC / Strapi mapping).
 * Uses the public origins above, then NEXT_IMAGE_URL, then other Strapi URL vars.
 */
export function cmsAssetOriginForServer(): string {
  return (
    publicCmsAssetOrigin() ||
    trimBase(process.env.NEXT_IMAGE_URL) ||
    trimBase(process.env.STRAPI_URL) ||
    trimBase(process.env.STRAPI_API_URL) ||
    trimBase(process.env.NEXT_PUBLIC_STRAPI_URL) ||
    ""
  );
}

function assetOriginForResolve(): string {
  if (typeof window === "undefined") {
    return cmsAssetOriginForServer();
  }
  return publicCmsAssetOrigin();
}

function isStrapiUploadsPath(pathname: string): boolean {
  return pathname.startsWith("/uploads/") || pathname === "/uploads";
}

function rewriteAbsoluteUploadsUrl(s: string): string | undefined {
  const base = assetOriginForResolve();
  if (!base) return undefined;
  try {
    const raw = s.startsWith("//") ? `https:${s}` : s;
    const u = new URL(raw);
    if (!isStrapiUploadsPath(u.pathname)) return undefined;
    return `${base}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return undefined;
  }
}

/**
 * Media URL for `<img src>` — uses `.env` public asset origins when joining paths.
 */
export function resolveUploadUrl(
  input: string | undefined | null,
  opts?: { width?: number; height?: number; style?: string }
): string | undefined {
  if (!input || typeof input !== "string") return undefined;
  const s = input.trim();
  if (!s) return undefined;

  if (/^https?:\/\//i.test(s)) {
    return rewriteAbsoluteUploadsUrl(s) ?? s;
  }
  if (s.startsWith("//")) {
    return rewriteAbsoluteUploadsUrl(s) ?? s;
  }

  const uploadBase = trimBase(process.env.NEXT_PUBLIC_UPLOAD_BASE);

  const queryForLegacy = (): string => {
    let q = `file=${encodeURIComponent(s)}`;
    if (opts?.width) q += `&width=${opts.width}`;
    if (opts?.height) q += `&height=${opts.height}`;
    if (opts?.style) q += `&style=${encodeURIComponent(opts.style)}`;
    return q;
  };

  if (uploadBase) {
    const legacy = /readFile\/?$/i.test(uploadBase);
    if (legacy) {
      return `${uploadBase}?${queryForLegacy()}`;
    }
    const relative = s.startsWith("/") ? s : `/${s}`;
    return `${uploadBase}${relative}`;
  }

  const isStrapiUploadsRelative =
    s.startsWith("/uploads/") || s === "/uploads" || s.startsWith("uploads/");

  /* Legacy Sails / admin: `frontend/js/navigation.js` `imgpath` + `uploadpath` filter → `…/upload/readFile?file=…` */
  if (!isStrapiUploadsRelative) {
    const apiRoot = trimBase(getApiBase());
    if (apiRoot) {
      return `${apiRoot}/upload/readFile?${queryForLegacy()}`;
    }
  }

  const origin = assetOriginForResolve();
  if (origin) {
    const path =
      s.startsWith("/") ? s
      : isStrapiUploadsRelative ? `/${s}`
      : `/uploads/${s}`;
    return `${origin}${path}`;
  }

  return undefined;
}
