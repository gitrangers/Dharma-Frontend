import "server-only";
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
  source: "strapi";
  heroSlides: HomeHeroSlide[];
  upcomingMovies: Record<string, unknown>[];
  recentMovies: Record<string, unknown>[];
  videoFeature: HomeVideoFeature | null;
  videoRows: HomeVideoRow[];
  newsItems: HomeNewsItem[];
};

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
  const cmsHeroRaw = await fetchStrapiDharmaSliderHeroSlides().catch(() => []);

  const cmsHero = mapCmsHeroToHome(cmsHeroRaw as { url?: string; image?: string; order?: number }[]);

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
