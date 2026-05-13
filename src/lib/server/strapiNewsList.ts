import "server-only";
import { resolveUploadUrl } from "@/lib/media";

/** Public Strapi REST collection for site news (same as `app/news-events/page.jsx`). */
export const STRAPI_NEWS_LISTS_URL =
  (typeof process.env.NEXT_PUBLIC_STRAPI_NEWS_URL === "string" &&
    process.env.NEXT_PUBLIC_STRAPI_NEWS_URL.trim()) ||
  "https://dharmacms2.tinglabs.in/api/news-lists";

/** ISR revalidate seconds for news list JSON (listing page + home strip). */
export const NEWS_LIST_REVALIDATE_SEC = 120;

function toRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function pickMediaUrl(media: unknown): string {
  if (!media) return "";
  if (typeof media === "string") return media;
  if (typeof media !== "object") return "";
  const top = toRecord(media);
  if (typeof top.url === "string" && top.url.trim()) return top.url.trim();
  const formats = toRecord(top.formats);
  const f =
    toRecord(formats.small) ||
    toRecord(formats.medium) ||
    toRecord(formats.large) ||
    toRecord(formats.thumbnail);
  if (typeof f.url === "string" && f.url.trim()) return f.url.trim();
  const inner = toRecord(top.data);
  if (typeof inner.url === "string" && inner.url.trim()) return inner.url.trim();
  const attrs = toRecord(inner.attributes);
  if (typeof attrs.url === "string" && attrs.url.trim()) return attrs.url.trim();
  const attrsFormats = toRecord(attrs.formats);
  const af =
    toRecord(attrsFormats.small) ||
    toRecord(attrsFormats.medium) ||
    toRecord(attrsFormats.large) ||
    toRecord(attrsFormats.thumbnail);
  if (typeof af.url === "string" && af.url.trim()) return af.url.trim();
  return "";
}

/** Normalized row for grid / home — links use `slug` when set, else `_id`. */
export type StrapiNewsGridItem = {
  _id: string;
  slug: string;
  title: string;
  date: unknown;
  text: string;
  imageUrl: string;
};

export function mapStrapiNewsListItem(item: unknown): StrapiNewsGridItem {
  const withAttrs = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const source = toRecord(withAttrs.attributes || item);
  const rawImage = pickMediaUrl(source.image) || pickMediaUrl(source.banner) || "";
  const title = String(source.title || "");
  const slug = String(source.slug || "").trim();
  return {
    _id: String(source.documentId || source.id || withAttrs.id || ""),
    slug,
    title,
    date: source.date ?? "",
    text: String(source.text || ""),
    imageUrl: resolveUploadUrl(rawImage) || rawImage || "",
  };
}
