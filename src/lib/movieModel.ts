export type CastEntry = {
  _id?: string;
  actor?: string;
  name?: string;
  image?: string;
  type?: string;
  order?: number;
};

export type CrewEntry = {
  _id?: string;
  title?: string;
  name?: string;
  order?: number;
  image?: string;
};

export type GalleryEntry = {
  _id?: string;
  image?: string;
  order?: number;
};

export type BehindTheScenesEntry = GalleryEntry;

export type VideoEntry = {
  _id?: string;
  url?: string;
  order?: number;
  name?: string;
  thumbnail?: string;
  isbanner?: string;
};

export type WallpaperEntry = {
  _id?: string;
  type?: string;
  order?: number | string;
  image?: string;
};

export type RelatedMovieRef = {
  _id?: string;
  relatedMovie?: RelatedMoviePopulated | string;
  order?: number | string;
  status?: boolean;
};

export type RelatedMoviePopulated = {
  _id: string;
  name?: string;
  year?: number;
  urlName?: string;
  status?: boolean;
  upcomingSmall?: string;
  recentSmall?: string;
  smallImage?: string;
};

export type MovieDoc = {
  _id: string;
  name?: string;
  releaseDate?: Date;
  director?: string;
  mainCast?: string;
  upcomingOrder?: number;
  bigImage?: string;
  status?: boolean;
  order?: number;
  upcomingSmall?: string;
  recentSmall?: string;
  smallImage?: string;
  backgroundImage?: string;
  mediumImage?: string;
  year?: number;
  month?: number;
  cutImage?: string;
  theatricalTrailerImage?: string;
  theatricalTrailerUrl?: string;
  cutImage2?: string;
  releaseType?: string;
  synopsis?: string;
  note?: string;
  /** When set in Strapi, used as public URL slug instead of buildUrlName(name, year). */
  urlName?: string;
  cast?: CastEntry[];
  crew?: CrewEntry[];
  gallery?: GalleryEntry[];
  behindTheScenes?: BehindTheScenesEntry[];
  videos?: VideoEntry[];
  wallpaper?: WallpaperEntry[];
  related?: RelatedMovieRef[];
};

function kebabCase(input: string): string {
  return String(input || "")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z\d])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function buildUrlName(name?: string, year?: number): string {
  const slug = kebabCase(name || "");
  return `${slug}_${year ?? 0}`;
}

/**
 * Path segment for `/movie/[slug]`, videos `movieKey`, etc.
 * Prefer CMS `urlName`, then Strapi `slug`, else `buildUrlName(name, year)`.
 */
export function resolveMovieUrlSlug(source: MovieDoc | Record<string, unknown> | null | undefined): string {
  if (!source || typeof source !== "object") return buildUrlName("", 0);
  const o = source as Record<string, unknown>;
  const u = typeof o.urlName === "string" ? o.urlName.trim() : "";
  if (u) return u.replace(/^\/+|\/+$/g, "").trim();
  const s = typeof o.slug === "string" ? o.slug.trim() : "";
  if (s) return s.replace(/^\/+|\/+$/g, "").trim();
  const name = typeof o.name === "string" ? o.name : "";
  const y = Number(o.year);
  return buildUrlName(name, Number.isFinite(y) ? y : 0);
}

/** Match legacy blank-image fallback as the legacy `api/services/Movie.js` behavior. */
export function applyMovieImageFallbacks<
  T extends Partial<MovieDoc> & Record<string, unknown>,
>(doc: T): T {
  if (!doc) return doc;
  const ytId = (doc.theatricalTrailerUrl as string) || "";
  const yt = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "";
  const val = (f: keyof MovieDoc) => {
    const v = doc[f as string] as unknown;
    return v != null && String(v).trim() !== "" ? String(v).trim() : "";
  };
  const fb =
    val("mediumImage") ||
    val("smallImage") ||
    val("recentSmall") ||
    val("upcomingSmall") ||
    val("bigImage") ||
    yt ||
    "";
  if (!val("mediumImage") && fb) (doc as Record<string, unknown>).mediumImage = fb;
  if (!val("smallImage") && fb) (doc as Record<string, unknown>).smallImage = fb;
  if (!val("recentSmall") && fb) (doc as Record<string, unknown>).recentSmall = fb;
  if (!val("upcomingSmall") && fb) (doc as Record<string, unknown>).upcomingSmall = fb;
  return doc;
}
