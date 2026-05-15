import "server-only";
import { cache } from "react";
import {
  applyMovieImageFallbacks,
  resolveMovieUrlSlug,
} from "@/lib/movieModel";
import { cmsAssetOriginForServer } from "@/lib/media";
import { fetchWithRevalidate } from "@/lib/server/fetchJson";

/**
 * Strapi movies: values come straight from `.env` / `.env.local` (`process.env`).
 * CMS host — first non-empty among STRAPI_URL, NEXT_PUBLIC_STRAPI_URL,
 * STRAPI_API_URL, then the image/asset hosts so one `.env` block can drive both:
 * NEXT_PUBLIC_STRAPI_ASSETS_URL, NEXT_PUBLIC_IMAGE_URL, NEXT_IMAGE_URL.
 * Token — REQUIRED (movies do not fetch without it): STRAPI_API_TOKEN,
 * STRAPI_AUTH_TOKEN, or STRAPI_TOKEN (JWT from Admin → Settings → API Tokens).
 */

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

function strapiBase() {
  const u =
    trim(process.env.STRAPI_URL) ||
    trim(process.env.NEXT_PUBLIC_STRAPI_URL) ||
    trim(process.env.STRAPI_API_URL) ||
    trim(process.env.NEXT_PUBLIC_STRAPI_ASSETS_URL) ||
    trim(process.env.NEXT_PUBLIC_IMAGE_URL) ||
    trim(process.env.NEXT_IMAGE_URL);
  return u.replace(/\/$/, "");
}

/**
 * Optional alternate origin for `dharma-sliders` only; otherwise {@link strapiBase}.
 */
function strapiSliderCmsOrigin() {
  const main = strapiBase();
  if (main) return main;
  const alt =
    trim(process.env.STRAPI_SLIDERS_URL) ||
    trim(process.env.NEXT_PUBLIC_STRAPI_SLIDERS_URL);
  return alt.replace(/\/$/, "");
}

function strapiToken() {
  return (
    normalizeEnvToken(process.env.STRAPI_API_TOKEN) ||
    normalizeEnvToken(process.env.STRAPI_AUTH_TOKEN) ||
    normalizeEnvToken(process.env.STRAPI_TOKEN)
  );
}

/** Strapi CMS API tokens look like JWTs (three base64url segments). */
function tokenLooksLikeStrapiJwt(t) {
  if (!t || typeof t !== "string") return false;
  const p = t.split(".");
  return p.length === 3 && p.every((x) => x.length > 0);
}

/** @type {boolean} */
let warnedTokenShape;

function warnIfSuspiciousApiToken(token) {
  if (!token || warnedTokenShape) return;
  if (!tokenLooksLikeStrapiJwt(token)) {
    warnedTokenShape = true;
    console.warn(
      "[Strapi] Token doesn't look like a Strapi JWT (expect xxx.yyy.zzz from Admin → Settings → API Tokens)."
    );
  }
}

function formatStrapiAuthError(resStatus, parsedMsg) {
  const base = parsedMsg || `Strapi ${resStatus}: Missing or invalid credentials`;
  return `${base}. Use a JWT from Strapi Admin → Settings → API Tokens with Movie find/findOne (plus related uploads if needed); set STRAPI_API_TOKEN or STRAPI_AUTH_TOKEN.`;
}

export function isStrapiMoviesEnabled() {
  return strapiBase().length > 0 && strapiToken().length > 0;
}

/** Strapi host configured (slider collection may be public without JWT). */
export function hasStrapiUrl() {
  return strapiBase().length > 0;
}

/**
 * Base URL + API token for generic Strapi REST calls (e.g. `POST /api/forms`).
 * @returns {{ base: string, token: string }}
 */
export function getStrapiRestConfig() {
  return { base: strapiBase(), token: strapiToken() };
}

/** Strapi v4 `attributes`; v5 often flat */
function normalizeStrapiDoc(entry) {
  if (!entry || typeof entry !== "object") return {};
  const e = entry;
  const attrs = e.attributes;
  if (attrs && typeof attrs === "object") {
    const a = attrs;
    return {
      ...a,
      id: e.id ?? a.id,
      documentId: e.documentId ?? a.documentId,
    };
  }
  return e;
}

/** Strapi relation payloads: [], `{ data: T[] }`, or `{ data: one }`. */
function strapiRelatedToArray(rel) {
  if (!rel) return [];
  if (Array.isArray(rel)) return rel.map((x) => normalizeStrapiDoc(x));
  const d = rel?.data;
  if (Array.isArray(d)) return d.map((x) => normalizeStrapiDoc(x));
  if (d && typeof d === "object") return [normalizeStrapiDoc(d)];
  return [];
}

function absAsset(pathOrUrl) {
  const s = (pathOrUrl || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) return s;
  const base = cmsAssetOriginForServer();
  if (!base) return s;
  return `${base}${s.startsWith("/") ? s : `/${s}`}`;
}

/** @param {string | undefined} origin Trimmed CMS origin (no trailing slash). */
function absAssetWithOrigin(pathOrUrl, origin) {
  const s = (pathOrUrl || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) return s;
  const o = (origin || "").replace(/\/$/, "");
  if (o) return `${o}${s.startsWith("/") ? s : `/${s}`}`;
  return absAsset(pathOrUrl);
}

function mediaUrl(m) {
  if (m == null) return "";
  if (typeof m === "string") {
    const s = m.trim();
    return s ? absAsset(s) : "";
  }
  if (typeof m !== "object") return "";

  const urlFromFormats = (obj) => {
    const formats = obj.formats;
    if (!formats || typeof formats !== "object") return "";
    const pick = formats.large || formats.medium || formats.small || formats.thumbnail;
    if (pick && typeof pick === "object" && typeof pick.url === "string" && pick.url.trim()) {
      return absAsset(pick.url);
    }
    return "";
  };

  const o = m;
  if (typeof o.url === "string" && o.url.trim()) return absAsset(o.url);
  const topF = urlFromFormats(o);
  if (topF) return topF;

  const data = o.data;
  if (data && typeof data === "object") {
    const inner = data;
    const attrs = inner.attributes;
    if (attrs && typeof attrs === "object") {
      if (typeof attrs.url === "string" && attrs.url.trim()) return absAsset(attrs.url);
      const af = urlFromFormats(attrs);
      if (af) return af;
    }
    if (typeof inner.url === "string" && inner.url.trim()) return absAsset(inner.url);
    const innerF = urlFromFormats(inner);
    if (innerF) return innerF;
  }

  return "";
}

/** Resolve Strapi media to absolute URL using a known CMS origin (e.g. slider fetch host). */
function mediaUrlWithOrigin(m, origin) {
  if (m == null) return "";
  if (typeof m === "string") {
    const s = m.trim();
    return s ? absAssetWithOrigin(s, origin) : "";
  }
  if (typeof m !== "object") return "";

  const urlFromFormats = (obj) => {
    const formats = obj.formats;
    if (!formats || typeof formats !== "object") return "";
    const pick = formats.large || formats.medium || formats.small || formats.thumbnail;
    if (pick && typeof pick === "object" && typeof pick.url === "string" && pick.url.trim()) {
      return absAssetWithOrigin(pick.url, origin);
    }
    return "";
  };

  const o = m;
  if (typeof o.url === "string" && o.url.trim()) return absAssetWithOrigin(o.url, origin);
  const topF = urlFromFormats(o);
  if (topF) return topF;

  const data = o.data;
  if (data && typeof data === "object") {
    const inner = data;
    const attrs = inner.attributes;
    if (attrs && typeof attrs === "object") {
      if (typeof attrs.url === "string" && attrs.url.trim()) {
        return absAssetWithOrigin(attrs.url, origin);
      }
      const af = urlFromFormats(attrs);
      if (af) return af;
    }
    if (typeof inner.url === "string" && inner.url.trim()) return absAssetWithOrigin(inner.url, origin);
    const innerF = urlFromFormats(inner);
    if (innerF) return innerF;
  }

  return "";
}

function numYear(y) {
  const n = Number(y);
  return Number.isFinite(n) ? n : 0;
}

/** @param {'asc' | 'desc'} [dir] */
function byOrder(rows, dir = "asc") {
  const inv = dir === "desc" ? -1 : 1;
  return [...rows].sort(
    (a, b) =>
      inv * ((Number(a.order ?? 0) || 0) - (Number(b.order ?? 0) || 0))
  );
}

function plain(v) {
  return JSON.parse(JSON.stringify(v));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET `/api/{resource}` — sends Bearer token when configured; works for public
 * endpoints when no token (e.g. `dharma-sliders?populate=*`).
 * @param {string} resource e.g. `dharma-sliders`
 * @param {Record<string, string | number | undefined>} [searchParams]
 * @param {{ origin?: string }} [opts] When `origin` is set, request that host (for public CMS without STRAPI_URL).
 */
async function strapiGetCollection(resource, searchParams, opts) {
  const override = opts?.origin != null ? trim(opts.origin).replace(/\/$/, "") : "";
  const base = override || strapiBase();
  if (!base) return [];

  const path = String(resource ?? "").replace(/^\//, "");
  if (!path) return [];

  const token = strapiToken();
  const url = new URL(`${base}/api/${path}`);
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  if (token) {
    warnIfSuspiciousApiToken(token);
  }

  const res = await fetchWithRevalidate(url.toString(), 60);
  const text = await res.text().catch(() => "");
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }

  if (json?.error) {
    const msg = json.error.message || JSON.stringify(json.error);
    if (token && (Number(json?.error?.status) === 401 || res.status === 401)) {
      console.warn(`[Strapi] ${path}: ${formatStrapiAuthError(401, msg)}`);
    } else if (!res.ok) {
      console.warn(`[Strapi] ${path}: ${msg}`);
    }
    return [];
  }
  if (!res.ok) {
    if (token && res.status === 401) {
      console.warn(`[Strapi] ${path}: ${formatStrapiAuthError(401, text.slice(0, 220))}`);
    } else if (res.status !== 404) {
      console.warn(`[Strapi] ${path}: HTTP ${res.status}`);
    }
    return [];
  }

  const d = json?.data;
  if (!Array.isArray(d)) return [];
  return d.map((entry) => normalizeStrapiDoc(entry));
}

/**
 * Fetch every page of a Strapi collection (e.g. `dharma-tvs` with 1000+ rows).
 * @param {string} resource
 * @param {Record<string, string | number | undefined>} [baseParams] e.g. `{ populate: '*' }`
 * @param {number} [pageSize]
 */
async function strapiGetCollectionAllPages(resource, baseParams = {}, pageSize = 100) {
  const base = strapiBase();
  if (!base) return [];

  const path = String(resource ?? "").replace(/^\//, "");
  if (!path) return [];

  const token = strapiToken();
  /** @type {Record<string, unknown>[]} */
  const all = [];
  let page = 1;

  const size = Math.min(Math.max(1, pageSize), 500);

  do {
    const url = new URL(`${base}/api/${path}`);
    for (const [k, v] of Object.entries(baseParams || {})) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
    url.searchParams.set("pagination[page]", String(page));
    url.searchParams.set("pagination[pageSize]", String(size));

    if (token) {
      warnIfSuspiciousApiToken(token);
    }

    const res = await fetchWithRevalidate(url.toString(), 60);
    const text = await res.text().catch(() => "");
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      break;
    }

    if (json?.error || !res.ok) {
      if (page === 1) {
        const msg = json?.error?.message || text.slice(0, 120);
        if (token && res.status === 401) {
          console.warn(`[Strapi] ${path}: ${formatStrapiAuthError(401, String(msg))}`);
        } else if (res.status !== 404) {
          console.warn(`[Strapi] ${path}: ${msg || res.status}`);
        }
      }
      break;
    }

    const d = json?.data;
    if (!Array.isArray(d) || d.length === 0) break;
    all.push(...d.map((entry) => normalizeStrapiDoc(entry)));
    page += 1;
    /** Stop after a partial page — `meta.pagination.pageCount` can be wrong on some Strapi setups. */
    if (d.length < size) break;
    if (page > 600) break;
  } while (true);

  return all;
}

/**
 * `/videos` nav — one entry per movie key, `videos` non-empty enables “OTHER MOVIES” links.
 * @param {Record<string, unknown>[]} rows from {@link fetchStrapiDharmaTvsFlattenedRows}
 */
export function buildStrapiVideoNavFromRows(rows) {
  if (!Array.isArray(rows)) return [];
  /** @type {Map<string, { name: string; _id: string; mongoId: string; videos: unknown[] }>} */
  const map = new Map();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const mk = typeof row.movieKey === "string" ? row.movieKey.trim() : "";
    if (!mk) continue;
    const m = row.movie && typeof row.movie === "object" ? row.movie : {};
    const docId =
      typeof m.documentId === "string" && m.documentId.trim() ? m.documentId.trim() : "";
    if (!map.has(mk)) {
      map.set(mk, {
        name: String(m.name ?? ""),
        _id: mk,
        mongoId: docId,
        videos: [],
      });
    }
    map.get(mk).videos.push(row);
  }
  const out = [...map.values()].map((v) => ({
    name: v.name,
    _id: v._id,
    mongoId: v.mongoId || v._id,
    videos: v.videos.length ? v.videos : null,
  }));
  return plain(
    out.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
      sensitivity: "base",
    }))
  );
}

/**
 * “POPULAR TAGS” on tv-inside — unique tag names from flattened `dharma-tvs` rows (`row.tag` string[]).
 * @param {Record<string, unknown>[]} rows
 */
export function collectPopularTagsFromDharmaTvRows(rows) {
  if (!Array.isArray(rows)) return [];
  /** @type {Map<string, { _id: string; name: string }>} */
  const seen = new Map();
  for (const row of rows) {
    const tags = Array.isArray(row.tag) ? row.tag : [];
    for (const t of tags) {
      const name = String(t ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { _id: name, name });
      }
    }
  }
  return plain(
    [...seen.values()].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" })
    )
  );
}

function isTruthyBanner(v) {
  return (
    v === true ||
    v === "true" ||
    String(v).toLowerCase() === "true" ||
    v === 1 ||
    v === "1"
  );
}

/**
 * Video grid rows from `GET /api/dharma-tvs?populate=*` (all pages), same shape as legacy Dharmatv + {@link fetchStrapiDharmaTvFlattenedRows}.
 * Row order matches Strapi (concatenated pages); set `sort` on the collection in Strapi or extend the fetch URL if you need a different sequence.
 * Banners (`isbanner`) are omitted — hero uses {@link fetchStrapiDharmaSliderHeroSlides}.
 * @see https://dharmacms2.tinglabs.in/api/dharma-tvs?populate=*
 */
export async function fetchStrapiDharmaTvsFlattenedRows() {
  try {
    const rawEntries = await strapiGetCollectionAllPages("dharma-tvs", { populate: "*" }, 100);
    /** @type {Record<string, unknown>[]} */
    const out = [];

    for (const raw of rawEntries) {
      if (!raw || typeof raw !== "object") continue;
      const entry = raw;
      if (isTruthyBanner(entry.isbanner)) continue;

      const movieRaw = entry.movie && typeof entry.movie === "object" ? entry.movie : {};
      const movie = normalizeStrapiDoc(movieRaw);
      const name = typeof movie.name === "string" ? movie.name.trim() : "";
      const year = numYear(movie.year);
      if (!name) continue;

      const movieKey = resolveMovieUrlSlug(movie);
      const yt = String(entry.url ?? "").trim();
      if (!yt) continue;

      const tagNames = strapiRelatedToArray(entry.tags)
        .map((t) => {
          const o = normalizeStrapiDoc(t);
          return typeof o.name === "string" ? o.name.trim() : "";
        })
        .filter(Boolean);

      const thumb =
        mediaUrl(entry.thumbnail) ||
        mediaUrl(entry.banner) ||
        "";
      const movieOrder =
        typeof movie.order === "number" ? movie.order : Number(movie.order) || 0;
      const vidOrder = entry.order == null ? 0 : Number(entry.order) || 0;
      const releaseDate =
        movie.releaseDate != null && String(movie.releaseDate).trim() ?
          String(movie.releaseDate).trim()
        : "";
      const movieMonth =
        typeof movie.month === "number" ? movie.month : Number(movie.month) || 0;
      const upcomingOrd =
        typeof movie.upcomingOrder === "number" ? movie.upcomingOrder : (
          Number(movie.upcomingOrder) || 0
        );

      /** @type {Record<string, unknown>} */
      const row = {
        movieKey,
        movie: {
          name,
          year,
          urlName: movieKey,
          documentId:
            typeof movie.documentId === "string" && movie.documentId ?
              movie.documentId
            : String(movie.id ?? ""),
          ...(releaseDate ? { releaseDate } : {}),
          ...(movieMonth ? { month: movieMonth } : {}),
          ...(upcomingOrd ? { upcomingOrder: upcomingOrd } : {}),
        },
        url: yt,
        title:
          typeof entry.title === "string" && entry.title.trim() ?
            entry.title.trim()
          : yt,
        order: vidOrder,
        movieOrder,
        tag: tagNames,
      };
      if (thumb) row.thumbnail = thumb;
      out.push(row);
    }

    // Keep Strapi list order (same sequence as GET /api/dharma-tvs?populate=* across pages).
    // Do not re-sort by movieOrder/video order — that overrides CMS ordering.

    return plain(out);
  } catch (err) {
    console.error("[Strapi] dharma-tvs:", err);
    return [];
  }
}

async function strapiGetMany(searchParams) {
  const base = strapiBase();
  const token = strapiToken();
  if (!base) throw new Error("STRAPI_URL is not set");

  if (!token) {
    throw new Error(
      "Movies require STRAPI_API_TOKEN or STRAPI_AUTH_TOKEN (JWT from Strapi Admin → Settings → API Tokens). Anonymous Strapi reads are disabled."
    );
  }

  warnIfSuspiciousApiToken(token);

  const url = new URL(`${base}/api/movies`);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }

  const res = await fetchWithRevalidate(url.toString(), 60);
  const text = await res.text().catch(() => "");
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`Strapi ${res.status}: ${text.slice(0, 200)}`);
    throw new Error(`Strapi: invalid JSON (${text.slice(0, 120)})`);
  }

  if (json?.error) {
    const msg = json.error.message || JSON.stringify(json.error);
    const st = Number(json?.error?.status ?? res.status) || res.status;
    if (st === 401 || res.status === 401) throw new Error(formatStrapiAuthError(st, msg));
    throw new Error(`Strapi ${st}: ${msg}`);
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error(formatStrapiAuthError(401, text.slice(0, 220)));
    throw new Error(`Strapi ${res.status}: ${text.slice(0, 200)}`);
  }

  const d = json?.data;
  if (d == null) return [];
  if (!Array.isArray(d)) {
    throw new Error(
      "Strapi /api/movies: expected data[]; got " + (typeof d === "object" ? "object" : typeof d)
    );
  }
  return d.map((entry) => normalizeStrapiDoc(entry));
}

function mapStrapiRowToMovieFields(item) {
  const year = numYear(item.year);
  const urlName = resolveMovieUrlSlug(item);
  const id =
    typeof item.documentId === "string" && item.documentId ?
      item.documentId
    : String(item.id ?? "");

  const row = {
    ...item,
    _id: id,
    documentId: item.documentId,
    id: item.id,
    year,
    urlName,
    smallImage: mediaUrl(item.smallImage),
    mediumImage: mediaUrl(item.mediumImage),
    bigImage: mediaUrl(item.bigImage),
    backgroundImage: mediaUrl(item.backgroundImage),
    recentSmall: mediaUrl(item.recentSmall),
    upcomingSmall: mediaUrl(item.upcomingSmall),
    cutImage: mediaUrl(item.cutImage),
    cutImage2: mediaUrl(item.cutImage2),
    theatricalTrailerImage: mediaUrl(item.theatricalTrailerImage),
    theatricalTrailerUrl:
      typeof item.theatricalTrailerUrl === "string" ? item.theatricalTrailerUrl : "",
    synopsis: typeof item.synopsis === "string" ? item.synopsis : "",
    note: typeof item.note === "string" ? item.note : "",
    name: typeof item.name === "string" ? item.name : "",
    releaseType: typeof item.releaseType === "string" ? item.releaseType : "",
    releaseDate: item.releaseDate,
    month: typeof item.month === "number" ? item.month : Number(item.month) || 0,
    upcomingOrder:
      typeof item.upcomingOrder === "number" ? item.upcomingOrder : (
        Number(item.upcomingOrder) || 0
      ),
    order: typeof item.order === "number" ? item.order : Number(item.order) || 0,
    status: typeof item.status === "boolean" ? item.status : true,
  };

  applyMovieImageFallbacks(row);

  const cmsStatus = typeof item.status === "boolean" ? item.status : true;
  const synopsisOk =
    String(row.synopsis || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\u00a0/g, " ")
      .trim()
      .length > 0;
  const backgroundOk = String(row.backgroundImage || "").trim().length > 0;
  row.status = cmsStatus && synopsisOk && backgroundOk;

  return row;
}

function sortAllMovies(rows) {
  return [...rows].sort(
    (a, b) =>
      (Number(b.upcomingOrder) || 0) - (Number(a.upcomingOrder) || 0)
  );
}

const LIST_POPULATE_KEYS = [
  "smallImage",
  "mediumImage",
  "bigImage",
  "backgroundImage",
  "recentSmall",
  "upcomingSmall",
  "cutImage",
  "cutImage2",
  "theatricalTrailerImage",
];

function listPopulateParams() {
  const p = {
    "pagination[pageSize]": "500",
    "sort[0]": "upcomingOrder:desc",
  };
  LIST_POPULATE_KEYS.forEach((key, i) => {
    p[`populate[${i}]`] = key;
  });
  return p;
}

const DETAIL_POPULATE_KEYS = [
  ...LIST_POPULATE_KEYS,
  "movie_casts",
  "movie_crews",
  "movie_film_videos",
  "movie_wallpapers",
  "movie_gallery_items",
  "movie_behind_scenes",
  "movie_awards",
  "related_from_movies",
  "news_lists",
];

function detailPopulateParams() {
  const p = {
    "pagination[pageSize]": "500",
    "sort[0]": "upcomingOrder:desc",
    "populate[movie_casts][populate][0]": "image",
    "populate[movie_crews][populate][0]": "image",
    "populate[movie_wallpapers][populate][0]": "image",
    "populate[movie_film_videos][populate][0]": "thumbnail",
    "populate[movie_behind_scenes][populate][0]": "image",
    "populate[movie_gallery_items][populate][0]": "image",
    "populate[news_lists][populate][0]": "image",
    "populate[news_lists][populate][1]": "banner",
  };
  DETAIL_POPULATE_KEYS.forEach((key, i) => {
    p[`populate[${i}]`] = key;
  });
  return p;
}

/**
 * Do not cache the movie list in module scope: Strapi edits (e.g. releaseType)
 * would never appear until the Next process restarts. Dedupe per request with
 * React `cache`; cross-request freshness uses `fetchWithRevalidate` from
 * `@/lib/server/fetchJson` (ISR `revalidate`).
 */
const loadAllMoviesForList = cache(async () => {
  let raw = [];
  try {
    raw = await strapiGetMany(listPopulateParams());
  } catch {
    raw = await strapiGetMany({
      "pagination[pageSize]": "500",
      "sort[0]": "upcomingOrder:desc",
    });
  }
  const mapped = raw.map((r) =>
    mapStrapiRowToMovieFields(typeof r === "object" && r ? r : {})
  );
  return sortAllMovies(mapped);
});

const loadDetailRawRows = cache(async () => {
  const attempts = [
    {
      "pagination[pageSize]": "500",
      "sort[0]": "upcomingOrder:desc",
      populate: "*",
      "populate[movie_casts][populate][0]": "image",
      "populate[movie_crews][populate][0]": "image",
      "populate[movie_wallpapers][populate][0]": "image",
      "populate[movie_film_videos][populate][0]": "thumbnail",
      "populate[movie_behind_scenes][populate][0]": "image",
      "populate[movie_gallery_items][populate][0]": "image",
      "populate[news_lists][populate][0]": "image",
      "populate[news_lists][populate][1]": "banner",
    },
    detailPopulateParams(),
    listPopulateParams(),
  ];
  let raw = [];
  for (const params of attempts) {
    try {
      raw = await strapiGetMany(params);
      if (raw.length) break;
    } catch {
      /* try next */
    }
  }
  return raw.map((r) => (typeof r === "object" && r ? r : {}));
});

export async function strapiFetchMovieDetails() {
  return plain(await loadAllMoviesForList());
}

export async function strapiFetchAllMovieName() {
  return plain(await loadAllMoviesForList());
}

export async function strapiFetchAllUpcomingMovies() {
  const all = await loadAllMoviesForList();
  const now = Date.now();
  const rows = all.filter((m) => {
    if (m.releaseType !== "Upcoming") return false;
    const rd = m.releaseDate ? new Date(String(m.releaseDate)).getTime() : NaN;
    if (Number.isNaN(rd)) return false;
    return rd >= now;
  });
  return plain(
    [...rows].sort(
      (a, b) =>
        new Date(String(a.releaseDate)).getTime() -
        new Date(String(b.releaseDate)).getTime()
    )
  );
}

export async function strapiFetchAllRecentMovies() {
  const all = await loadAllMoviesForList();
  const rows = all.filter((m) => m.releaseType === "Recent");
  return plain(sortAllMovies(rows));
}

/**
 * @param {unknown} rel
 * @param {{ order?: 'asc' | 'desc' }} [opts]
 */
function mapGalleryLike(rel, opts) {
  const items = strapiRelatedToArray(rel);
  const out = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const o = normalizeStrapiDoc(raw);
    const img =
      mediaUrl(o.image) ||
      mediaUrl(o.media) ||
      mediaUrl(o.file) ||
      mediaUrl(o.photo);
    if (!img) continue;
    out.push({
      _id: typeof o.documentId === "string" ? o.documentId : String(o.id ?? ""),
      image: img,
      order: Number(o.order) || 0,
    });
  }
  const dir = opts?.order === "desc" ? "desc" : "asc";
  return byOrder(out, dir);
}

function mapWallpapers(rel) {
  const items = strapiRelatedToArray(rel);
  const out = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const o = normalizeStrapiDoc(raw);
    const img =
      mediaUrl(o.image) ||
      mediaUrl(o.media) ||
      mediaUrl(o.desktopImage) ||
      mediaUrl(o.mobileImage);
    if (!img) continue;
    out.push({
      _id: typeof o.documentId === "string" ? o.documentId : String(o.id ?? ""),
      type: typeof o.type === "string" ? o.type : "",
      order:
        typeof o.order === "number" || typeof o.order === "string" ? o.order : (
          Number(o.order) || 0
        ),
      image: img,
    });
  }
  return byOrder(out);
}

/** Legacy `News` / movie-inside “News” tab (api/models-style fields). */
function mapMovieNews(rows) {
  const list = Array.isArray(rows) ? rows.map((x) => normalizeStrapiDoc(x)) : [];
  const out = [];
  for (const o of list) {
    if (!o || typeof o !== "object") continue;
    const title =
      (typeof o.title === "string" && o.title.trim()) ?
        o.title.trim()
      : (typeof o.name === "string" && o.name.trim()) ?
        o.name.trim()
      : (typeof o.headline === "string" && o.headline.trim()) ?
        o.headline.trim()
      : "";
    const image =
      mediaUrl(o.image) ||
      mediaUrl(o.photo) ||
      mediaUrl(o.media) ||
      mediaUrl(o.picture) ||
      mediaUrl(o.file) ||
      mediaUrl(o.thumbnail) ||
      mediaUrl(o.cover) ||
      "";
    const banner = mediaUrl(o.banner) || "";
    const text = typeof o.text === "string" ? o.text : "";
    const link = typeof o.link === "string" ? o.link.trim() : "";
    if (!title && !image && !banner && !text.trim() && !link) continue;
    let idRaw =
      typeof o.documentId === "string" && o.documentId.trim() ?
        o.documentId.trim()
      : o.id != null && String(o.id) !== "" ? String(o.id) : "";
    if (!idRaw && link) idRaw = `ext:${link.slice(0, 120)}`;
    if (!idRaw && title) idRaw = `t:${title.slice(0, 80)}`;
    if (!idRaw) continue;
    const dateRaw = o.date ?? o.publishedAt ?? o.publishDate ?? o.newsDate ?? o.createdAt;
    let date;
    if (dateRaw != null) {
      const d = new Date(String(dateRaw));
      if (!Number.isNaN(d.getTime())) date = d;
    }
    const keywords = typeof o.keywords === "string" ? o.keywords : "";
    /** @type {Record<string, unknown>} */
    const row = {
      _id: idRaw,
      order: Number(o.order) || 0,
    };
    if (image) row.image = image;
    if (banner) row.banner = banner;
    if (title) row.title = title;
    if (keywords) row.keywords = keywords;
    if (date) row.date = date;
    if (text) row.text = text;
    if (link) row.link = link;
    const slugRaw = typeof o.slug === "string" && o.slug.trim() ? o.slug.trim() : "";
    if (slugRaw) row.slug = slugRaw;
    out.push(row);
  }
  return byOrder(out);
}

function mapCast(items) {
  const list = Array.isArray(items) ? items.map((x) => normalizeStrapiDoc(x)) : strapiRelatedToArray(items);
  const out = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const o = normalizeStrapiDoc(raw);
    const image =
      mediaUrl(o.image) ||
      mediaUrl(o.photo) ||
      mediaUrl(o.portrait) ||
      mediaUrl(o.headshot) ||
      mediaUrl(o.picture) ||
      mediaUrl(o.file) ||
      mediaUrl(o.media) ||
      "";
    out.push({
      _id: typeof o.documentId === "string" ? o.documentId : String(o.id ?? ""),
      actor: typeof o.actor === "string" ? o.actor : "",
      name: typeof o.name === "string" ? o.name : "",
      type: typeof o.type === "string" ? o.type : "Cast",
      order:
        typeof o.order === "number" ? o.order : (
          Number(o.order) || 0
        ),
      ...(image ? { image } : {}),
    });
  }
  return byOrder(out);
}

function mapCrew(items) {
  const list = Array.isArray(items) ? items.map((x) => normalizeStrapiDoc(x)) : strapiRelatedToArray(items);
  const out = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const o = normalizeStrapiDoc(raw);
    const titleRaw =
      typeof o.title === "string" && o.title.trim() ?
        o.title.trim()
      : typeof o.role === "string" && o.role.trim() ?
        o.role.trim()
      : typeof o.jobTitle === "string" && o.jobTitle.trim() ?
        o.jobTitle.trim()
      : "";
    const image =
      mediaUrl(o.image) ||
      mediaUrl(o.photo) ||
      mediaUrl(o.picture) ||
      mediaUrl(o.file) ||
      mediaUrl(o.media) ||
      "";
    out.push({
      _id: typeof o.documentId === "string" ? o.documentId : String(o.id ?? ""),
      title: titleRaw,
      name: typeof o.name === "string" ? o.name : "",
      order:
        typeof o.order === "number" ? o.order : (
          Number(o.order) || 0
        ),
      ...(image ? { image } : {}),
    });
  }
  return byOrder(out);
}

function mapVideos(rel) {
  const items = strapiRelatedToArray(rel);
  const out = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const o = normalizeStrapiDoc(raw);
    const ban = o.isbanner;
    const thumb =
      mediaUrl(o.thumbnail) ||
      mediaUrl(o.image) ||
      mediaUrl(o.poster) ||
      "";
    const displayName =
      typeof o.name === "string" && o.name.trim() ?
        o.name.trim()
      : typeof o.title === "string" && o.title.trim() ?
        o.title.trim()
      : "";
    /** @type {Record<string, unknown>} */
    const row = {
      _id: typeof o.documentId === "string" ? o.documentId : String(o.id ?? ""),
      url: typeof o.url === "string" ? o.url : "",
      name: displayName,
      order: Number(o.order) || 0,
      isbanner: typeof ban === "boolean" ? String(ban) : ban || "",
    };
    if (thumb) row.thumbnail = thumb;
    out.push(row);
  }
  return byOrder(out);
}

/** Flatten `/api/movies` + `movie_film_videos` into Dharmatv-like rows for `/videos`. */
export async function fetchStrapiDharmaTvFlattenedRows() {
  const rawRows = await loadDetailRawRows();
  /** @type {Record<string, unknown>[]} */
  const out = [];
  const moviesSorted = [...rawRows].sort(
    (a, b) =>
      (Number(b.upcomingOrder ?? b.order) || 0) -
      (Number(a.upcomingOrder ?? a.order) || 0)
  );

  for (const raw of moviesSorted) {
    const mv = normalizeStrapiDoc(raw);
    const name = typeof mv.name === "string" ? mv.name.trim() : "";
    const year = numYear(mv.year);
    if (!name) continue;

    const mappedMovie = mapStrapiRowToMovieFields(mv);
    const movieKey = mappedMovie.urlName;
    const filmVideos = mapVideos(mv.movie_film_videos);

    for (const v of filmVideos) {
      const yt = String(v.url ?? "").trim();
      if (!yt) continue;
      /** @type {Record<string, unknown>} */
      const row = {
        movieKey,
        movie: {
          name,
          year,
          urlName: movieKey,
          ...(mappedMovie.releaseDate != null &&
          String(mappedMovie.releaseDate).trim() ?
            { releaseDate: String(mappedMovie.releaseDate).trim() }
          : {}),
          ...(Number(mappedMovie.month) ?
            { month: Number(mappedMovie.month) }
          : {}),
          ...(Number(mappedMovie.upcomingOrder) ?
            { upcomingOrder: Number(mappedMovie.upcomingOrder) }
          : {}),
        },
        url: yt,
        title:
          typeof v.name === "string" && v.name.trim() ? v.name.trim() : yt,
        order: Number(v.order) || 0,
        tag: [],
      };
      const thumb =
        typeof mappedMovie.smallImage === "string" ?
          mappedMovie.smallImage.trim()
        : "";
      if (thumb) row.thumbnail = thumb;
      out.push(row);
    }
  }
  return plain(out);
}

/**
 * Hero-band slides from Strapi single type `dharma-sliders`
 * (`GET /api/dharma-sliders?populate=*`) — same shape as Sails / legacy player:
 * `{ url: youtubeId, image: absolute URL, order }`.
 * @see https://dharmacms2.tinglabs.in/api/dharma-sliders?populate=*
 */
export async function fetchStrapiDharmaSliderHeroSlides() {
  try {
    const origin = strapiSliderCmsOrigin();
    const rows = await strapiGetCollection("dharma-sliders", { populate: "*" }, { origin });
    /** @type {{ url: string; image: string; order: number }[]} */
    const slides = [];
    for (const raw of rows) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw;
      const yt = String(row.url ?? "").trim();
      const img = mediaUrlWithOrigin(row.image, origin) || mediaUrl(row.image) || "";
      if (!yt && !img) continue;
      slides.push({
        url: yt,
        image: img,
        order: Number(row.order) || 0,
      });
    }
    slides.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return plain(slides);
  } catch (err) {
    console.error("[Strapi] dharma-sliders:", err);
    return [];
  }
}

/**
 * Home-page hero slides from `dharma-slider-homes?populate=*`.
 * Each entry has: order, url (may be empty), image (landscape 1600×713),
 * mobileImage (portrait 705×1087), movie.urlName (for internal link).
 *
 * @returns {{ order:number, url:string, image:string, mobileImage:string, movieSlug:string|null }[]}
 */
export async function fetchStrapiHomeSliderSlides() {
  try {
    const origin = strapiSliderCmsOrigin();
    const rows = await strapiGetCollection("dharma-slider-homes", { populate: "*" }, { origin });
    /** @type {{ order:number, url:string, image:string, mobileImage:string, movieSlug:string|null }[]} */
    const slides = [];
    for (const raw of rows) {
      if (!raw || typeof raw !== "object") continue;
      const row = /** @type {Record<string,unknown>} */ (raw);
      const img = mediaUrlWithOrigin(row.image, origin) || mediaUrl(row.image) || "";
      const mobImg = mediaUrlWithOrigin(row.mobileImage, origin) || mediaUrl(row.mobileImage) || "";
      if (!img && !mobImg) continue;
      const movie = row.movie && typeof row.movie === "object" ? row.movie : null;
      const movieSlug =
        movie && typeof (/** @type {any} */ (movie)).urlName === "string"
          ? String((/** @type {any} */ (movie)).urlName).trim() || null
          : null;
      slides.push({
        order: Number(row.order) || 0,
        url: String(row.url ?? "").trim(),
        image: img,
        mobileImage: mobImg,
        movieSlug,
      });
    }
    slides.sort((a, b) => a.order - b.order);
    return plain(slides);
  } catch (err) {
    console.error("[Strapi] dharma-slider-homes:", err);
    return [];
  }
}

/**
 * Fetch all rows from `dharma-sliders?populate=*` sorted by `order` descending (highest = latest/featured).
 * Returns plain objects: { order, url (YouTube ID), image (absolute URL), title }.
 * The first element is intended as the home-page featured video; the rest feed the strip.
 *
 * @see https://dharmacms2.tinglabs.in/api/dharma-sliders?populate=*
 */
export async function fetchStrapiDharmaSliders() {
  try {
    const origin = strapiSliderCmsOrigin();
    const rows = await strapiGetCollection(
      "dharma-sliders",
      { populate: "*", "sort[0]": "order:desc" },
      { origin }
    );
    /** @type {{ order:number, url:string, image:string, title:string }[]} */
    const results = [];
    for (const raw of rows) {
      if (!raw || typeof raw !== "object") continue;
      const row = /** @type {Record<string,unknown>} */ (raw);
      const img = mediaUrlWithOrigin(row.image, origin) || mediaUrl(row.image) || "";
      const ytUrl = String(row.url ?? "").trim();
      results.push({
        order: Number(row.order) || 0,
        url: ytUrl,
        image: img,
        title: String(row.title ?? "").trim(),
      });
    }
    // ensure descending by order (Strapi sort may not be guaranteed across pages)
    results.sort((a, b) => b.order - a.order);
    return plain(results);
  } catch (err) {
    console.error("[Strapi] dharma-sliders:", err);
    return [];
  }
}

/**
 * Hero-band slides compatible with {@link VideosPageView} — from `movie_film_videos` where `isbanner` is true.
 */
export async function fetchStrapiDharmaTvHeroSlides() {
  const rawRows = await loadDetailRawRows();
  /** @type {Record<string, unknown>[]} */
  const slides = [];

  const moviesSorted = [...rawRows].sort(
    (a, b) =>
      (Number(b.upcomingOrder ?? b.order) || 0) -
      (Number(a.upcomingOrder ?? a.order) || 0)
  );

  for (const raw of moviesSorted) {
    const mv = normalizeStrapiDoc(raw);
    const mappedMovie = mapStrapiRowToMovieFields(mv);
    const trailerImg =
      typeof mappedMovie.theatricalTrailerImage === "string" ?
        mappedMovie.theatricalTrailerImage.trim()
      : "";

    const filmVideos = mapVideos(mv.movie_film_videos);
    for (const v of filmVideos) {
      const ban = v.isbanner;
      const isBanner =
        ban === true ||
        ban === "true" ||
        String(ban).toLowerCase() === "true";
      if (!isBanner) continue;

      const yt = String(v.url ?? "").trim();
      if (!yt) continue;

      slides.push({
        url: yt,
        image: trailerImg || mappedMovie.smallImage || "",
        order: Number(v.order) || 0,
      });
    }
  }
  slides.sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0));
  return plain(slides);
}

/**
 * Movie list for Videos pages: `_id` = url slug (`urlName`), `videos` populated so “OTHER MOVIES” links enable.
 */
export async function fetchStrapiMovieNamesForVideosNav() {
  const rawRows = await loadDetailRawRows();
  const mapped = rawRows.map((raw) => {
    const mv = normalizeStrapiDoc(raw);
    const fm = mapStrapiRowToMovieFields(mv);
    const clips = mapVideos(mv.movie_film_videos).filter((v) =>
      String(v.url ?? "").trim()
    );
    return {
      ...fm,
      mongoId:
        typeof fm.documentId === "string" ? fm.documentId : String(fm._id ?? ""),
      _id: fm.urlName,
      videos: clips.length ? clips : null,
    };
  });
  return plain(sortAllMovies(mapped));
}

/**
 * Deduplicate Strapi movie-award entries (merged relation list + GET /api/movie-awards).
 * @param {unknown[]} rows
 */
function dedupeMovieAwardRows(rows) {
  const seen = new Set();
  const out = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const o = normalizeStrapiDoc(raw);
    const key =
      typeof o.documentId === "string" && o.documentId.trim() ?
        `d:${o.documentId.trim()}`
      : o.id != null && Number.isFinite(Number(o.id)) ?
        `i:${Number(o.id)}`
      : "";
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(o);
  }
  return out;
}

/** @type {typeof dedupeMovieAwardRows} */
const dedupeMovieWallpaperRows = dedupeMovieAwardRows;

/** @type {typeof dedupeMovieAwardRows} */
const dedupeMovieNewsRows = dedupeMovieAwardRows;

function mapAwards(rel) {
  const items = strapiRelatedToArray(rel);
  /** Strapi `movie-awards`: `title` = ceremony/show (accordion), `awardname` = category line inside. */
  const rows = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const o = normalizeStrapiDoc(raw);
    const ceremony = typeof o.title === "string" ? o.title.trim() : "";
    const category = typeof o.awardname === "string" ? o.awardname.trim() : "";
    const winner = typeof o.winner === "string" ? o.winner.trim() : "";
    // Omit unpopulated relation stubs (id-only) so list+API merge can replace them.
    if (!ceremony && !category && !winner) continue;
    rows.push({
      ceremony,
      category,
      note: typeof o.note === "string" ? o.note : "",
      winner,
      year: typeof o.year === "number" ? o.year : Number(o.year) || 0,
    });
  }
  const groups = new Map();
  for (const r of rows) {
    const key =
      r.ceremony ? `${r.ceremony}\0${r.year}` : `${r.category}\0${r.year}\0${r.winner}`;
    const g = groups.get(key) ?? [];
    g.push(r);
    groups.set(key, g);
  }
  const out = [];
  for (const [, g] of groups) {
    const head = g[0];
    if (!head) continue;
    const name = head.ceremony || head.category || "Awards";
    out.push({
      _id: `${name}-${head.year}-${g.map((x) => x.category).join(",").slice(0, 120)}`,
      name,
      year: head.year,
      award: g.map((x) => ({
        awardname: x.category,
        winner: x.winner,
        note: x.note,
      })),
    });
  }
  out.sort(
    (a, b) =>
      (Number(b.year) || 0) - (Number(a.year) || 0) || String(a.name).localeCompare(String(b.name)),
  );
  return out;
}

/** Merge related movie docs: CMS `movie-related-links` first, then embedded `related_from_movies`. */
function mergeRelatedDeduped(fromLinksMapped, fromEmbeddedMapped) {
  const seen = new Set();
  const out = [];
  for (const list of [fromLinksMapped, fromEmbeddedMapped]) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const k =
        typeof item.urlName === "string" && item.urlName.trim() ?
          item.urlName.trim()
        : String(item._id || "").trim();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/** `/api/movie-related-links` rows for the current movie (`fromMovie` → `toMovie`). */
async function strapiFetchMovieRelatedLinkRowsForPickedMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && String(picked.id).trim() !== "" ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = {
    populate: "*",
    "pagination[pageSize]": "200",
  };

  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[fromMovie][documentId][$eq]": docId });
    paramSets.push({ ...base, "filters[from_movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[fromMovie][id][$eq]": numId });
    paramSets.push({ ...base, "filters[from_movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-related-links", params);
    if (rows.length) return rows;
  }

  const all = await strapiGetCollectionAllPages("movie-related-links", { populate: "*" }, 150);

  return all.filter((row) => {
    if (!row || typeof row !== "object") return false;
    const from = row.fromMovie ?? row.from_movie;
    if (!from || typeof from !== "object") return false;
    const f = normalizeStrapiDoc(from);
    if (docId && String(f.documentId || "").trim() === docId) return true;
    if (numId && String(f.id ?? "") === numId) return true;
    return false;
  });
}

function mapRelated(raw, byId) {
  if (!Array.isArray(raw)) return [];

  const resolved = [];
  for (const rawLink of raw) {
    if (!rawLink || typeof rawLink !== "object") continue;
    const link = normalizeStrapiDoc(rawLink);
    const target =
      link.toMovie ??
      link.to_movie ??
      link.movie ??
      link.relatedMovie;
    let doc = null;
    if (target && typeof target === "object") {
      const t = normalizeStrapiDoc(target);
      if (typeof t.name === "string" && t.name) {
        doc = mapStrapiRowToMovieFields(t);
      } else {
        const key =
          typeof t.documentId === "string" && t.documentId.trim() ?
            t.documentId.trim()
          : t.id != null ? String(t.id) : "";
        if (key) doc = byId.get(key) ?? null;
      }
    }
    if (!doc && (typeof target === "string" || typeof target === "number")) {
      doc = byId.get(String(target)) ?? null;
    }
    if (!doc && target && typeof target === "object" && "id" in target) {
      const targetId = String(target.id ?? "");
      const hit = [...byId.values()].find(
        (m) => String(m.id ?? "") === targetId || String(m.documentId ?? "") === targetId
      );
      if (hit) doc = hit;
    }
    if (!doc) continue;
    resolved.push({
      order:
        Number(link.order) ||
        Number(link.sortOrder) ||
        Number(link.sort_order) ||
        0,
      doc: {
        _id: String(doc._id),
        name: doc.name,
        year: doc.year,
        urlName: doc.urlName,
        status: doc.status,
        upcomingSmall: doc.upcomingSmall,
        recentSmall: doc.recentSmall,
        smallImage: doc.smallImage,
      },
    });
  }
  return resolved.sort((a, b) => a.order - b.order).map((x) => x.doc);
}

const REL_STRIP = new Set([
  "movie_casts",
  "movie_crews",
  "movie_film_videos",
  "movie_wallpapers",
  "movie_gallery_items",
  "movie_behind_scenes",
  "movie_awards",
  "related_from_movies",
  "news_lists",
  "dharma_tvs",
]);

function pickMovieRaw(rows, slug) {
  const decoded = decodeURIComponent(slug || "").trim();
  if (!decoded || !Array.isArray(rows) || !rows.length) return null;

  /** Prefer exact match on CMS `urlName` / `slug` or derived slug. */
  const exact = rows.find((r) => resolveMovieUrlSlug(r) === decoded);
  if (exact) return exact;

  const parts = decoded.split("_");
  const yearPart = parts.length > 1 ? parts[parts.length - 1] : "";
  const yearNum = Number(yearPart);
  const nameKebabParts =
    Number.isFinite(yearNum) && yearNum > 0 ? parts.slice(0, -1) : parts;
  const namePart = nameKebabParts.join(" ").replace(/-/g, " ").trim();

  if (!namePart) return null;

  const re = new RegExp(escapeRegex(namePart), "i");
  const candidates = rows.filter((r) => {
    if (!re.test(String(r.name || ""))) return false;
    if (!Number.isFinite(yearNum) || yearNum <= 0) return true;
    return numYear(r.year) === yearNum;
  });

  return candidates.length ? candidates[0] : null;
}

function stripRelationsForMovie(m) {
  const o = { ...m };
  for (const k of REL_STRIP) delete o[k];
  return o;
}

/**
 * When `GET /api/movies` omits or strips `movie_casts`, load cast rows like the CMS
 * `GET /api/movie-casts?populate=*` list (filter by parent movie).
 */
async function strapiFetchMovieCastsForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-casts", params);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * Same pattern as casts: `GET /api/movie-crews?populate=*&filters[movie][documentId][$eq]=...`
 */
async function strapiFetchMovieCrewsForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-crews", params);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * Same pattern: `GET /api/movie-awards?populate=*&filters[movie][documentId][$eq]=...`
 */
async function strapiFetchMovieAwardsForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-awards", params);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * `GET /api/movie-wallpapers?populate=*&filters[movie][documentId][$eq]=...`
 */
async function strapiFetchMovieWallpapersForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-wallpapers", params);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * `GET /api/movie-film-videos?populate=*&filters[movie][documentId][$eq]=...`
 */
async function strapiFetchMovieFilmVideosForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-film-videos", params);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * `GET /api/movie-behind-scenes?populate=*&filters[movie][documentId][$eq]=...`
 */
async function strapiFetchMovieBehindScenesForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-behind-scenes", params);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * `GET /api/movie-gallery-items?populate=*&filters[movie][documentId][$eq]=...`
 */
async function strapiFetchMovieGalleryItemsForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
  }

  for (const params of paramSets) {
    const rows = await strapiGetCollection("movie-gallery-items", params);
    if (rows.length) return rows;
  }
  return [];
}

/** REST collection slugs tried for per-movie news and single-article fetches. */
const NEWS_LIST_COLLECTIONS = [
  "news-lists",
  "news-list",
  "movie-news",
  "movie-newses",
  "movie-news-items",
];

/**
 * Per-movie news rows (legacy Sails `News` filtered by `movie`).
 * Tries common Strapi collection UIDs; same filter pattern as `movie-wallpapers`.
 */
async function strapiFetchMovieNewsForMovie(picked) {
  if (!picked || typeof picked !== "object") return [];
  const docId =
    typeof picked.documentId === "string" && picked.documentId.trim() ?
      picked.documentId.trim()
    : "";
  const numId =
    picked.id != null && Number.isFinite(Number(picked.id)) ? String(picked.id) : "";

  if (!docId && !numId) return [];

  const base = { populate: "*", "pagination[pageSize]": "1000" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (docId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": docId });
    paramSets.push({ ...base, "filters[movies][documentId][$eq]": docId });
  }
  if (numId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": numId });
    paramSets.push({ ...base, "filters[movies][id][$eq]": numId });
  }

  for (const resource of NEWS_LIST_COLLECTIONS) {
    for (const params of paramSets) {
      const rows = await strapiGetCollection(resource, params);
      if (rows.length) return rows;
    }
  }
  return [];
}

/** @param {Record<string, unknown>} picked Normalized Strapi movie row */
async function strapiFetchNewsListForMoviePick(picked) {
  const newsFromRelation = strapiRelatedToArray(
    picked.news_lists ??
      picked.newsLists ??
      picked.news_list ??
      picked.newsList ??
      picked.movie_news ??
      picked.movieNews ??
      picked.movie_newss ??
      picked.movieNewss,
  );
  const newsFromApi = await strapiFetchMovieNewsForMovie(picked);
  return mapMovieNews(dedupeMovieNewsRows([...newsFromRelation, ...newsFromApi]));
}

/**
 * News list for a movie (same shape as `Movie.getMovieNews` / movie-inside tab).
 * @param {string} slug Movie `urlName` / Strapi slug
 */
export async function strapiFetchNewsListForMovieSlug(slug) {
  if (!isStrapiMoviesEnabled()) return [];
  const rawRows = await loadDetailRawRows();
  const picked = pickMovieRaw(rawRows, slug);
  if (!picked) return [];
  return plain(await strapiFetchNewsListForMoviePick(picked));
}

export async function strapiTryFetchOneMovie(slug) {
  const rawRows = await loadDetailRawRows();
  const picked = pickMovieRaw(rawRows, slug);
  if (!picked) return null;

  const summaryByKey = new Map();
  for (const r of rawRows) {
    const mapped = mapStrapiRowToMovieFields(r);
    summaryByKey.set(String(mapped._id), mapped);
    if (mapped.id != null && String(mapped.id).trim() !== "") {
      summaryByKey.set(String(mapped.id), mapped);
    }
  }

  const mappedCore = mapStrapiRowToMovieFields(picked);
  const movie = stripRelationsForMovie(mappedCore);

  let castRows = strapiRelatedToArray(picked.movie_casts);
  let cast = mapCast(castRows);
  if (cast.length === 0) {
    castRows = await strapiFetchMovieCastsForMovie(picked);
    cast = mapCast(castRows);
  }

  let crewRows = strapiRelatedToArray(picked.movie_crews);
  let crew = mapCrew(crewRows);
  if (crew.length === 0) {
    crewRows = await strapiFetchMovieCrewsForMovie(picked);
    crew = mapCrew(crewRows);
  }

  const awardFromRelation = strapiRelatedToArray(
    picked.movie_awards ?? picked.movieAwards,
  );
  const awardFromApi = await strapiFetchMovieAwardsForMovie(picked);
  const award = mapAwards(dedupeMovieAwardRows([...awardFromRelation, ...awardFromApi]));

  const wallpaperFromRelation = strapiRelatedToArray(
    picked.movie_wallpapers ?? picked.movieWallpapers,
  );
  const wallpaperFromApi = await strapiFetchMovieWallpapersForMovie(picked);
  const wallpaper = mapWallpapers(
    dedupeMovieWallpaperRows([...wallpaperFromRelation, ...wallpaperFromApi]),
  );

  const videosFromRelation = strapiRelatedToArray(
    picked.movie_film_videos ?? picked.movieFilmVideos,
  );
  const videosFromApi = await strapiFetchMovieFilmVideosForMovie(picked);
  const videos = mapVideos(dedupeMovieAwardRows([...videosFromRelation, ...videosFromApi]));

  const btsFromRelation = strapiRelatedToArray(
    picked.movie_behind_scenes ?? picked.movieBehindScenes,
  );
  const btsFromApi = await strapiFetchMovieBehindScenesForMovie(picked);
  const behindTheScenes = mapGalleryLike(
    dedupeMovieAwardRows([...btsFromRelation, ...btsFromApi]),
  );

  const galleryFromRelation = strapiRelatedToArray(
    picked.movie_gallery_items ?? picked.movieGalleryItems,
  );
  const galleryFromApi = await strapiFetchMovieGalleryItemsForMovie(picked);
  const gallery = mapGalleryLike(
    dedupeMovieAwardRows([...galleryFromRelation, ...galleryFromApi]),
  );

  const news = await strapiFetchNewsListForMoviePick(picked);

  const relatedFromEmbedded = mapRelated(
    strapiRelatedToArray(picked.related_from_movies),
    summaryByKey,
  );
  let relatedFromLinks = [];
  try {
    const linkRows = await strapiFetchMovieRelatedLinkRowsForPickedMovie(picked);
    relatedFromLinks = mapRelated(linkRows, summaryByKey);
  } catch {
    relatedFromLinks = [];
  }

  const result = {
    movie,
    cast,
    crew,
    gallery,
    wallpaper,
    videos,
    behindTheScenes,
    related: mergeRelatedDeduped(relatedFromLinks, relatedFromEmbedded),
    news,
    award,
  };

  return plain(result);
}

function escapeHtmlPlain(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strapi Blocks (minimal) → HTML for news body */
function strapiBlocksToHtml(blocks) {
  if (!Array.isArray(blocks)) return "";
  const parts = [];
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const type = b.type;
    const children = b.children;
    if (!Array.isArray(children)) continue;
    const text = children
      .map((c) => (c && typeof c === "object" && typeof c.text === "string" ? c.text : ""))
      .join("");
    if (type === "paragraph") {
      parts.push(`<p>${escapeHtmlPlain(text)}</p>`);
    } else if (type === "heading") {
      const level = Math.min(6, Math.max(2, Number(b.level) || 2));
      parts.push(`<h${level}>${escapeHtmlPlain(text)}</h${level}>`);
    } else if (type === "list") {
      const tag = b.format === "ordered" ? "ol" : "ul";
      parts.push(`<${tag}><li>${escapeHtmlPlain(text)}</li></${tag}>`);
    }
  }
  return parts.join("");
}

function normalizeNewsArticleBody(o) {
  const t = o.text ?? o.body ?? o.content ?? o.article;
  if (t == null) return "";
  if (typeof t === "string") return t;
  if (Array.isArray(t)) return strapiBlocksToHtml(t);
  if (typeof t === "object" && Array.isArray(t.blocks)) return strapiBlocksToHtml(t.blocks);
  return "";
}

function mapArticleForDetailPage(raw) {
  const o = normalizeStrapiDoc(raw);
  const _id = String(o.documentId || o.id || "").trim();
  const title = String(o.title || o.name || "").trim();
  const dateRaw = o.date ?? o.publishedAt ?? o.newsDate ?? o.createdAt;
  let dateIso = "";
  if (dateRaw != null) {
    const d = new Date(String(dateRaw));
    if (!Number.isNaN(d.getTime())) dateIso = d.toISOString();
  }
  const banner = mediaUrl(o.banner) || "";
  const image = mediaUrl(o.image) || mediaUrl(o.photo) || "";
  const html = normalizeNewsArticleBody(o);
  const link = typeof o.link === "string" ? o.link.trim() : "";
  return { _id, title, dateIso, banner, image, html, link };
}

function mapRelatedCardForDetailPage(raw) {
  const o = normalizeStrapiDoc(raw);
  const _id = String(o.documentId || o.id || "").trim();
  const title = String(o.title || o.name || "").trim();
  const dateRaw = o.date ?? o.publishedAt ?? o.createdAt;
  let dateIso = "";
  if (dateRaw != null) {
    const d = new Date(String(dateRaw));
    if (!Number.isNaN(d.getTime())) dateIso = d.toISOString();
  }
  const image =
    mediaUrl(o.image) || mediaUrl(o.banner) || mediaUrl(o.thumbnail) || "";
  const slug = typeof o.slug === "string" && o.slug.trim() ? o.slug.trim() : "";
  return { _id, title, dateIso, image, ...(slug ? { slug } : {}) };
}

/**
 * @returns {{ row: unknown, resource: string } | null}
 */
async function strapiFindNewsArticleRow(rawSegment) {
  const segment = String(rawSegment || "").trim();
  if (!segment) return null;
  if (!strapiBase() || !strapiToken()) return null;

  const paramsBase = { populate: "*", "pagination[pageSize]": "5" };
  /** Prefer URL slug; keep documentId / numeric id for bookmarks and CMS links. */
  const variants = [
    { ...paramsBase, "filters[slug][$eq]": segment },
    { ...paramsBase, "filters[documentId][$eq]": segment },
    { ...paramsBase, "filters[id][$eq]": segment },
  ];
  for (const resource of NEWS_LIST_COLLECTIONS) {
    for (const params of variants) {
      const rows = await strapiGetCollection(resource, params);
      if (rows.length) return { row: rows[0], resource };
    }
  }
  return null;
}

async function strapiFetchRelatedNewsByArticle(articleRow, resource, excludeId) {
  const o = normalizeStrapiDoc(articleRow);
  const movieRaw = o.movie ?? (Array.isArray(o.movies) ? o.movies[0] : o.movies);
  if (!movieRaw || typeof movieRaw !== "object") return [];
  const m = normalizeStrapiDoc(movieRaw);
  const movieDocId = typeof m.documentId === "string" && m.documentId.trim() ? m.documentId.trim() : "";
  const movieNumId =
    m.id != null && Number.isFinite(Number(m.id)) ? String(m.id) : "";
  if (!movieDocId && !movieNumId) return [];

  const base = { populate: "*", "pagination[pageSize]": "24" };
  /** @type {Record<string, string | number | undefined>[]} */
  const paramSets = [];
  if (movieDocId) {
    paramSets.push({ ...base, "filters[movie][documentId][$eq]": movieDocId });
    paramSets.push({ ...base, "filters[movies][documentId][$eq]": movieDocId });
  }
  if (movieNumId) {
    paramSets.push({ ...base, "filters[movie][id][$eq]": movieNumId });
    paramSets.push({ ...base, "filters[movies][id][$eq]": movieNumId });
  }

  const exclude = String(excludeId || "").trim();
  for (const params of paramSets) {
    const rows = await strapiGetCollection(resource, params);
    if (rows.length) {
      const norm = rows.map((r) => normalizeStrapiDoc(r));
      return norm.filter((r) => {
        const rid = String(r.documentId || r.id || "").trim();
        return rid && rid !== exclude;
      });
    }
  }
  return [];
}

/**
 * Single news article + same-movie related list (legacy `News/getOneNews` shape).
 * @param {string} articleId Strapi `slug` (preferred), `documentId`, numeric `id`, or legacy Mongo `_id`.
 */
export async function strapiTryFetchNewsArticle(articleId) {
  const hit = await strapiFindNewsArticleRow(articleId);
  if (!hit) return null;
  const article = mapArticleForDetailPage(hit.row);
  if (!article._id) return null;
  const relatedRows = await strapiFetchRelatedNewsByArticle(
    hit.row,
    hit.resource,
    article._id,
  );
  const related = relatedRows.slice(0, 12).map((r) => mapRelatedCardForDetailPage(r));
  return plain({ article, related });
}

/** Default host for `/api/dictionaries` when no `STRAPI_DICTIONARIES_URL` — not `localhost` / Sails {@link https://dharmacms2.tinglabs.in/api/dictionaries?populate=*}. */
const DICTIONARY_CMS_ORIGIN_DEFAULT = "https://dharmacms2.tinglabs.in";

function dictionaryStrapiOrigin() {
  const explicit =
    trim(process.env.STRAPI_DICTIONARIES_URL) ||
    trim(process.env.NEXT_PUBLIC_STRAPI_DICTIONARIES_URL);
  if (explicit) return explicit.replace(/\/$/, "");
  return DICTIONARY_CMS_ORIGIN_DEFAULT.replace(/\/$/, "");
}

/**
 * Dharma Dictionary cards from Strapi (flat entries + populated `image`).
 * Uses {@link dictionaryStrapiOrigin} so this never follows `NEXT_PUBLIC_API_URL` localhost.
 */
export async function strapiFetchDictionaries() {
  const origin = dictionaryStrapiOrigin();
  const rows = await strapiGetCollection(
    "dictionaries",
    {
      "pagination[pageSize]": "500",
      populate: "*",
    },
    { origin },
  );
  return plain(byOrder(rows));
}
