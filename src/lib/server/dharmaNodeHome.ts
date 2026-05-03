import "server-only";
import { getApiBase, unwrapList } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/media";
import {
  fetchStrapiDharmaSliderHeroSlides,
  fetchStrapiDharmaTvsFlattenedRows,
} from "@/lib/server/movies/strapi";
import {
  fetchAllRecentMovies,
  fetchAllUpcomingMovies,
} from "@/lib/server/movies/list";

export type HomeHeroSlide = {
  order: number;
  image: string;
  /** YouTube id or URL when slide opens a clip */
  url: string;
  /** When set, hero links to this movie slug (Sails homeslider + movie) */
  movieSlug?: string | null;
};

export type HomeVideoFeature = {
  image: string;
  url: string;
};

export type HomeVideoRow = {
  url: string;
  title: string;
  thumbnail?: string;
  order?: number;
  movieOrder?: number;
};

export type HomeNewsItem = {
  id: string;
  title: string;
  image?: string;
  date?: string;
};

export type HomePageData = {
  source: "sails" | "strapi";
  heroSlides: HomeHeroSlide[];
  upcomingMovies: Record<string, unknown>[];
  recentMovies: Record<string, unknown>[];
  /** Sails: featured tile from `dharmahome/getDharmaTvHome` — when set, `videoRows` is strip only */
  videoFeature: HomeVideoFeature | null;
  videoRows: HomeVideoRow[];
  newsItems: HomeNewsItem[];
};

function trimBase(): string {
  const u = getApiBase().trim();
  if (!u || u === "/") return "";
  return u;
}

async function sailsPost(path: string, body: Record<string, unknown> = {}): Promise<unknown> {
  const base = trimBase();
  if (!base) return null;
  const url = `${base}${path.replace(/^\//, "")}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn(`[Sails] ${path}: HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn(`[Sails] ${path}:`, e);
    return null;
  }
}

function upcomingSortKey(n: Record<string, unknown>): number {
  const rd = n.releaseDate;
  if (rd) {
    const a = new Date(String(rd));
    if (!Number.isNaN(a.getTime()) && a.getFullYear() >= 2050) return 0;
    if (!Number.isNaN(a.getTime())) return a.getTime();
  }
  const month = Number(n.month) || 1;
  const year = Number(n.year) || 0;
  return new Date(year, Math.min(11, Math.max(0, month - 1)), 1).getTime();
}

function normalizeUpcomingMovies(rows: unknown[]): Record<string, unknown>[] {
  const list = rows.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  const patched = list.map((n) => {
    const o = { ...n };
    if (o.urlName && typeof o.urlName === "string") o._id = o.urlName;
    const rd = o.releaseDate;
    if (rd) {
      const a = new Date(String(rd));
      if (!Number.isNaN(a.getTime()) && a.getFullYear() >= 2050) o.releaseDate = "";
    }
    return o;
  });
  return patched.sort((a, b) => upcomingSortKey(a) - upcomingSortKey(b));
}

function mapHomeSliderRows(raw: unknown): HomeHeroSlide[] {
  const rows = unwrapList(raw) as Record<string, unknown>[];
  const slides: HomeHeroSlide[] = [];
  for (const s of rows) {
    if (!s || typeof s !== "object") continue;
    const image = resolveUploadUrl(String(s.image ?? "").trim()) || "";
    const url = String(s.url ?? "").trim();
    const order = Number(s.order) || 0;
    const status = s.status === true || s.status === "true";
    const movie = s.movie && typeof s.movie === "object" ? (s.movie as Record<string, unknown>) : null;
    const movieSlug =
      status && movie && typeof movie.urlName === "string" && movie.urlName.trim() ?
        movie.urlName.trim().replace(/^\/+|\/+$/g, "")
      : null;
    slides.push({
      order,
      image: image || (url ? "" : ""),
      url,
      movieSlug: movieSlug || null,
    });
  }
  slides.sort((a, b) => b.order - a.order);
  return slides.filter((s) => s.image || s.url || s.movieSlug);
}

function mapDharmaHomeTvFeature(raw: unknown): HomeVideoFeature | null {
  const rows = unwrapList(raw) as Record<string, unknown>[];
  const first = rows[0];
  if (!first || typeof first !== "object") return null;
  const image = resolveUploadUrl(String(first.image ?? "").trim()) || "";
  const url = String(first.url ?? "").trim();
  if (!image && !url) return null;
  return { image, url };
}

function mapTvHomeSliderRows(raw: unknown): HomeVideoRow[] {
  const rows = unwrapList(raw) as Record<string, unknown>[];
  const out: HomeVideoRow[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const url = String(row.url ?? "").trim();
    if (!url) continue;
    const movie = row.movie && typeof row.movie === "object" ? (row.movie as Record<string, unknown>) : null;
    const movieOrder = movie ? Number(movie.upcomingOrder) || 0 : 0;
    const thumb = resolveUploadUrl(
      String(row.thumbnail ?? "").trim() || (typeof row.thumbnail === "string" ? row.thumbnail : "")
    );
    out.push({
      url,
      title: String(row.title ?? "").trim(),
      thumbnail: thumb || undefined,
      order: Number(row.order) || 0,
      movieOrder,
    });
  }
  out.sort(
    (a, b) => (b.movieOrder ?? 0) - (a.movieOrder ?? 0) || (b.order ?? 0) - (a.order ?? 0)
  );
  return out;
}

function mapNewsRows(raw: unknown, limit: number): HomeNewsItem[] {
  const rows = unwrapList(raw) as Record<string, unknown>[];
  const out: HomeNewsItem[] = [];
  for (const n of rows.slice(0, limit)) {
    if (!n || typeof n !== "object") continue;
    const id =
      n._id != null ? String(n._id) : n.documentId != null ? String(n.documentId) : "";
    if (!id) continue;
    const title = String(n.title ?? "").trim();
    const imageRaw = String(n.image ?? n.banner ?? "").trim();
    const image = resolveUploadUrl(imageRaw) || undefined;
    let dateStr = "";
    if (n.date) {
      const d = new Date(String(n.date));
      if (!Number.isNaN(d.getTime())) dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    out.push({ id, title, image, date: dateStr });
  }
  return out;
}

/**
 * Same calls as `frontend/js/navigation.js` + `HomeCtrl` (DharmaNode localhost:1337).
 */
export async function fetchDharmaNodeHomeData(): Promise<HomePageData | null> {
  if (!trimBase()) return null;

  const [sliderRaw, upcomingRaw, recentRaw, tvHomeRaw, tvSliderRaw, newsRaw] = await Promise.all([
    sailsPost("homeslider/getAllHomeSlider", {}),
    sailsPost("Movie/getAllUpcomingMovies", {}),
    sailsPost("Movie/getAllRecentMovies", {}),
    sailsPost("dharmahome/getDharmaTvHome", {}),
    sailsPost("dharmatv/getDharmaTvHomeSlider", {}),
    sailsPost("News/getAll", {}),
  ]);

  const hasAny =
    sliderRaw != null ||
    upcomingRaw != null ||
    recentRaw != null ||
    tvHomeRaw != null ||
    tvSliderRaw != null;

  if (!hasAny) {
    console.warn("[Sails] Home: no responses — check NEXT_PUBLIC_API_URL and that Sails is running.");
    return null;
  }

  const upcomingMovies = normalizeUpcomingMovies(unwrapList(upcomingRaw ?? { data: [] }));
  const recentList = unwrapList(recentRaw ?? { data: [] }) as Record<string, unknown>[];
  const recentMovies = recentList.map((n) => {
    const o = { ...n };
    if (o.urlName && typeof o.urlName === "string") o._id = o.urlName;
    return o;
  });

  return {
    source: "sails",
    heroSlides: mapHomeSliderRows(sliderRaw ?? { data: [] }),
    upcomingMovies,
    recentMovies,
    videoFeature: mapDharmaHomeTvFeature(tvHomeRaw ?? { data: [] }),
    videoRows: mapTvHomeSliderRows(tvSliderRaw ?? { data: [] }),
    newsItems: mapNewsRows(newsRaw ?? { data: [] }, 10),
  };
}

function mapCmsHeroToHome(
  slides: { url?: string; image?: string; order?: number }[]
): HomeHeroSlide[] {
  if (!Array.isArray(slides) || slides.length === 0) return [];
  return slides
    .filter((s) => s && (String(s.url || "").trim() || String(s.image || "").trim()))
    .map((s, i) => ({
      order: Number(s.order) || i,
      image: String(s.image ?? ""),
      url: String(s.url ?? ""),
      movieSlug: null,
    }));
}

export async function loadHomePageData(): Promise<HomePageData> {
  const [sails, cmsHeroRaw] = await Promise.all([
    fetchDharmaNodeHomeData(),
    fetchStrapiDharmaSliderHeroSlides().catch(() => []),
  ]);

  const cmsHero = mapCmsHeroToHome(cmsHeroRaw as { url?: string; image?: string; order?: number }[]);

  if (sails) {
    if (cmsHero.length > 0) {
      return { ...sails, heroSlides: cmsHero };
    }
    return sails;
  }

  const [upcomingMovies, recentMovies, strapiVideoRows] = await Promise.all([
    fetchAllUpcomingMovies().catch(() => []),
    fetchAllRecentMovies().catch(() => []),
    fetchStrapiDharmaTvsFlattenedRows().catch(() => []),
  ]);

  const heroSlides: HomeHeroSlide[] = cmsHero.length > 0 ? cmsHero : [];

  const videoRows: HomeVideoRow[] = (strapiVideoRows as HomeVideoRow[]).map((r) => ({
    url: String(r.url ?? ""),
    title: String(r.title ?? ""),
    thumbnail: r.thumbnail,
    order: Number(r.order) || 0,
    movieOrder: Number(r.movieOrder) || 0,
  }));

  return {
    source: "strapi",
    heroSlides,
    upcomingMovies: upcomingMovies as Record<string, unknown>[],
    recentMovies: recentMovies as Record<string, unknown>[],
    videoFeature: null,
    videoRows,
    newsItems: [],
  };
}
