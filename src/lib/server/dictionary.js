import "server-only";
import { cache } from "react";
import { apiPost, unwrapList } from "@/lib/api";
import { pickStrapiMediaUrl } from "@/lib/media";
import { strapiFetchDictionaries } from "@/lib/server/movies/strapi";

/** @typedef {{ key: string, def: string, title: string, name: string, grammar: string, description: string, imagePath: string }} DictionaryCardProps */

function asRec(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v;
}

/** @returns {DictionaryCardProps | null} */
function mapDictionaryRow(src, index) {
  const s = asRec(src);
  if (!s) return null;
  const imagePath =
    pickStrapiMediaUrl(s.image) ||
    pickStrapiMediaUrl(s.banner) ||
    (typeof s.image === "string" ? s.image : "") ||
    (typeof s.banner === "string" ? s.banner : "") ||
    "";
  return {
    key: String(s.documentId ?? s.id ?? s._id ?? index),
    def: String(s.def ?? ""),
    title: String(s.title ?? ""),
    name: String(s.name ?? ""),
    grammar: String(s.grammar ?? s.tens ?? ""),
    description: String(s.description ?? s.meaning ?? ""),
    imagePath: String(imagePath || "").trim(),
  };
}

/**
 * Canonical list: Strapi [`/api/dictionaries?populate=*`](https://dharmacms2.tinglabs.in/api/dictionaries?populate=*)
 * via {@link strapiFetchDictionaries} (production CMS host, not localhost).
 */
async function fetchDictionaryFromStrapi() {
  try {
    const rows = await strapiFetchDictionaries();
    /** @type {DictionaryCardProps[]} */
    const out = [];
    rows.forEach((row, i) => {
      const c = mapDictionaryRow(row, i);
      if (c) out.push(c);
    });
    return out;
  } catch {
    return [];
  }
}

async function fetchDictionaryFromLegacySails() {
  try {
    const raw = await apiPost("dictionary/findLimited", {
      pagenumber: 1,
      pagesize: 500,
    });
    const list = unwrapList(raw);
    /** @type {DictionaryCardProps[]} */
    const out = [];
    list.forEach((row, i) => {
      const e = asRec(row);
      if (!e) return;
      const src = asRec(e.attributes) ?? e;
      const c = mapDictionaryRow(src, i);
      if (c) out.push(c);
    });
    return out;
  } catch {
    return [];
  }
}

/**
 * Cards for `/dictionary` — Strapi CMS first ({@link strapiFetchDictionaries}), then legacy Sails if empty.
 */
export const fetchDictionaryCards = cache(async () => {
  const fromCms = await fetchDictionaryFromStrapi();
  if (fromCms.length > 0) return fromCms;
  return fetchDictionaryFromLegacySails();
});
