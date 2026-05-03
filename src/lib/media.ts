function trimBase(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
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

  const origin = assetOriginForResolve();
  if (origin) {
    const path = s.startsWith("/") ? s : `/uploads/${s}`;
    return `${origin}${path}`;
  }

  return undefined;
}
