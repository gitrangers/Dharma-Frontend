import "server-only";
import {
  mapStrapiNewsListItem,
  NEWS_LIST_REVALIDATE_SEC,
  STRAPI_NEWS_LISTS_URL,
} from "@/lib/server/strapiNewsList";
import { fetchJsonWithRevalidate } from "@/lib/server/fetchJson";
import {
  fetchStrapiHomeSliderSlides,
  fetchStrapiDharmaSliders,
  fetchStrapiDharmaTvsFlattenedRows,
} from "@/lib/server/movies/strapi";
import {
  fetchAllRecentMovies,
  fetchAllUpcomingMovies,
} from "@/lib/server/movies/list";

export type HomeHeroSlide = {
  order: number;
  /** Desktop landscape image (1600 × 713) */
  image: string;
  /** Portrait image shown on mobile (705 × 1087) */
  mobileImage?: string;
  /** YouTube id or URL when slide opens a clip */
  url: string;
  /** `urlName` of the linked movie — drives internal `/movie/[slug]` link */
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
  /** Strapi slug for `/news-events/[slug]`; falls back to `id` in links when absent. */
  slug?: string;
};

export type HomePageData = {
  source: "strapi";
  heroSlides: HomeHeroSlide[];
  upcomingMovies: Record<string, unknown>[];
  recentMovies: Record<string, unknown>[];
  videoFeature: HomeVideoFeature | null;
  videoRows: HomeVideoRow[];
  newsItems: HomeNewsItem[];
  /** True when CMS has more than 10 articles — shows “More stories” tile like legacy home. */
  newsShowMoreStories: boolean;
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

const HOME_NEWS_MAX = 10;
/** Fetch one extra row so we know whether to show the legacy “More stories” tile */
const HOME_NEWS_FETCH_PAGE_SIZE = HOME_NEWS_MAX + 1;

async function fetchHomeNewsPayload(): Promise<{
  newsItems: HomeNewsItem[];
  newsShowMoreStories: boolean;
}> {
  const params = new URLSearchParams();
  params.set("pagination[page]", "1");
  params.set("pagination[pageSize]", String(HOME_NEWS_FETCH_PAGE_SIZE));
  params.set("sort[0]", "date:desc");
  params.set("populate", "*");
  const url = `${STRAPI_NEWS_LISTS_URL}?${params.toString()}`;
  try {
    const json = (await fetchJsonWithRevalidate(
      url,
      NEWS_LIST_REVALIDATE_SEC,
    )) as { data?: unknown[] };
    const rows = Array.isArray(json?.data) ? json.data : [];
    const mapped = rows.map((row) => {
      const m = mapStrapiNewsListItem(row);
      let dateLabel = "";
      if (m.date) {
        const dt = new Date(String(m.date));
        if (!Number.isNaN(dt.getTime())) {
          dateLabel = new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }).format(dt);
        }
      }
      const slug = m.slug.trim();
      return {
        id: m._id,
        ...(slug ? { slug } : {}),
        title: m.title,
        ...(m.imageUrl ? { image: m.imageUrl } : {}),
        ...(dateLabel ? { date: dateLabel } : {}),
      };
    });

    const hasMoreThanMax = mapped.length > HOME_NEWS_MAX;
    const newsItems = hasMoreThanMax ? mapped.slice(0, HOME_NEWS_MAX) : mapped;

    return { newsItems, newsShowMoreStories: hasMoreThanMax };
  } catch {
    return { newsItems: [], newsShowMoreStories: false };
  }
}


function mapHomeSliderToHero(
  slides: { url?: string; image?: string; mobileImage?: string; order?: number; movieSlug?: string | null }[]
): HomeHeroSlide[] {
  if (!Array.isArray(slides) || slides.length === 0) return [];
  return slides
    .filter((s) => s && (String(s.image || "").trim() || String(s.mobileImage || "").trim()))
    .map((s, i) => ({
      order: Number(s.order) || i,
      image: String(s.image ?? ""),
      mobileImage: s.mobileImage ? String(s.mobileImage) : undefined,
      url: String(s.url ?? ""),
      movieSlug: s.movieSlug ?? null,
    }));
}

export async function loadHomePageData(): Promise<HomePageData> {
  const cmsHeroRaw: unknown[] = await Promise.resolve(fetchStrapiHomeSliderSlides() as unknown).then(
    (v) => (Array.isArray(v) ? v : []),
    () => [],
  );

  const cmsHero = mapHomeSliderToHero(
    cmsHeroRaw as { url?: string; image?: string; mobileImage?: string; order?: number; movieSlug?: string | null }[]
  );

  const [
    upcomingMovies,
    recentMovies,
    dharmaSliderRows,
    dharmaTvRows,
    newsPayload,
  ] = await Promise.all([
    fetchAllUpcomingMovies().catch(() => []),
    fetchAllRecentMovies().catch(() => []),
    (fetchStrapiDharmaSliders as () => Promise<unknown[]>)().catch(() => []),
    (fetchStrapiDharmaTvsFlattenedRows as () => Promise<unknown[]>)().catch(() => []),
    fetchHomeNewsPayload(),
  ]);
  const { newsItems, newsShowMoreStories } = newsPayload;

  const heroSlides: HomeHeroSlide[] = cmsHero.length > 0 ? cmsHero : [];

  // dharma-sliders sorted desc by order — first item = featured big video
  type SliderRow = { order: number; url: string; image: string; title: string };
  const sliderRows = (dharmaSliderRows as SliderRow[]).filter(
    (r) => r && (r.url || r.image)
  );

  const videoFeature: HomeVideoFeature | null =
    sliderRows.length > 0
      ? { image: sliderRows[0].image, url: sliderRows[0].url }
      : null;

  // dharma-tvs — only the fields needed for the strip: url, title, thumbnail
  type TvRow = { url: string; title: string; thumbnail?: string; order?: number; movieOrder?: number };
  const videoRows: HomeVideoRow[] = (dharmaTvRows as TvRow[])
    .filter((r) => r && r.url)
    .map((r) => ({
      url: String(r.url ?? ""),
      title: String(r.title ?? ""),
      thumbnail: r.thumbnail || "",
      order: Number(r.order) || 0,
      movieOrder: Number(r.movieOrder) || 0,
    }));

  return {
    source: "strapi",
    heroSlides,
    upcomingMovies: upcomingMovies as Record<string, unknown>[],
    recentMovies: recentMovies as Record<string, unknown>[],
    videoFeature,
    videoRows,
    newsItems,
    newsShowMoreStories,
  };
}
