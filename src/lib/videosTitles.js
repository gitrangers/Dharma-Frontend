import { buildUrlName } from "@/lib/movieModel";

/**
 * Map slug / Mongo id → canonical movie name from Movie/getAllMovieName.
 * Safe for client bundles (no `server-only`).
 * @param {Array<Record<string, unknown>>} nameRows
 */
export function buildMovieTitleLookups(nameRows) {
  /** @type {Record<string, string>} RSC-safe: `{}` — not `Object.create(null)` (null prototype rejects Client props). */
  const bySlug = {};
  /** @type {Record<string, string>} */
  const byMongoId = {};

  if (!Array.isArray(nameRows)) return { bySlug, byMongoId };

  for (const m of nameRows) {
    if (!m || typeof m !== "object") continue;
    const name =
      typeof m.name === "string" && m.name.trim() ? m.name.trim() : "";
    if (!name) continue;

    const year = Number(m.year) || 0;
    const urlRaw =
      typeof m.urlName === "string" && m.urlName.trim() ?
        m.urlName.trim()
      : buildUrlName(name, year);
    const urlKey = urlRaw.toLowerCase();
    const derivedKey = buildUrlName(name, year).toLowerCase();

    bySlug[urlKey] = name;
    if (derivedKey !== urlKey) bySlug[derivedKey] = name;

    const mid =
      typeof m.mongoId === "string" && m.mongoId.trim() ? m.mongoId.trim() : "";
    if (mid) byMongoId[mid] = name;
  }

  return { bySlug, byMongoId };
}

/**
 * Prefer Movie catalog title over embedded Tv `movie.name`.
 * @param {Record<string, unknown>} row
 * @param {{ bySlug?: Record<string, string>; byMongoId?: Record<string, string> } | null | undefined} lookups
 */
export function resolveMovieTitleFromTvRow(row, lookups) {
  if (!row || typeof row !== "object") return "Other";

  const movieKeyRaw =
    typeof row.movieKey === "string" && row.movieKey.trim() ?
      row.movieKey.trim()
    : "";

  const movie =
    row.movie && typeof row.movie === "object" ?
      /** @type {Record<string, unknown>} */ (row.movie)
    : {};

  const movieName =
    typeof movie.name === "string" ? movie.name.trim()
    : "";
  const movieYear = Number(movie.year) || 0;

  const key =
    movieKeyRaw ?
      movieKeyRaw
    : buildUrlName(movieName, movieYear);

  const bySlug =
    lookups && lookups.bySlug && typeof lookups.bySlug === "object" ?
      lookups.bySlug
    : {};
  const byMongo =
    lookups && lookups.byMongoId && typeof lookups.byMongoId === "object" ?
      lookups.byMongoId
    : {};

  const fromSlug =
    typeof key === "string" && key ? bySlug[key.toLowerCase()] : undefined;

  const midRaw =
    movie._id != null && String(movie._id).trim() ?
      String(movie._id).trim()
    : "";
  const fromMongo = midRaw ? byMongo[midRaw] : undefined;

  return fromSlug || fromMongo || movieName || key.replace(/-/g, " ") || "Other";
}

/**
 * Parse release timeline from Tv row `movie` (Strapi dates, numeric year/month, or upcomingOrder).
 * @param {Record<string, unknown>} movie
 */
function parseMovieReleaseSort(movie) {
  const m = movie && typeof movie === "object" ? movie : {};
  const y = Number(m.year) || 0;
  const month = Number(m.month) || 0;
  const uo = Number(m.upcomingOrder) || 0;

  const rd = m.releaseDate;
  if (rd != null && String(rd).trim()) {
    const t = new Date(String(rd)).getTime();
    if (!Number.isNaN(t)) {
      return { releaseMs: t, year: y || new Date(t).getFullYear(), upcomingOrder: uo };
    }
  }

  if (y > 0) {
    const mi = month >= 1 && month <= 12 ? month - 1 : 0;
    return {
      releaseMs: new Date(y, mi, 1).getTime(),
      year: y,
      upcomingOrder: uo,
    };
  }

  return { releaseMs: 0, year: 0, upcomingOrder: uo };
}

/**
 * Sort key for one `/videos` movie block (uses first clip row — rows in a block share `movie`).
 * @param {Record<string, unknown>} row
 */
export function videosMovieGroupSortKey(row) {
  if (!row || typeof row !== "object") {
    return { releaseMs: 0, upcomingOrder: 0, movieOrder: 0, year: 0 };
  }
  const r = row;
  const m = r.movie && typeof r.movie === "object" ? r.movie : {};
  const parsed = parseMovieReleaseSort(m);
  return {
    releaseMs: parsed.releaseMs,
    upcomingOrder: parsed.upcomingOrder,
    movieOrder:
      typeof r.movieOrder === "number" ? r.movieOrder : Number(r.movieOrder) || 0,
    year: parsed.year || Number(m.year) || 0,
  };
}

/** Newer releases first; undated titles follow CMS movie / row order (desc). */
export function compareVideosMovieGroupKeys(a, b) {
  if (a.releaseMs !== b.releaseMs) return b.releaseMs - a.releaseMs;
  if (a.upcomingOrder !== b.upcomingOrder) return b.upcomingOrder - a.upcomingOrder;
  if (a.movieOrder !== b.movieOrder) return b.movieOrder - a.movieOrder;
  if (a.year !== b.year) return b.year - a.year;
  return 0;
}
