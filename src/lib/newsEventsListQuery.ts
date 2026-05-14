/**
 * Shared Strapi list URL for `/news-events` (page + infinite scroll API).
 * Keep in sync with `strapiNewsList.ts` `STRAPI_NEWS_LISTS_URL`.
 */
export const NEWS_LIST_PAGE_SIZE = 9;

const STRAPI_NEWS_LISTS_URL =
  (typeof process.env.NEXT_PUBLIC_STRAPI_NEWS_URL === "string" &&
    process.env.NEXT_PUBLIC_STRAPI_NEWS_URL.trim()) ||
  "https://dharmacms2.tinglabs.in/api/news-lists";

const NEWS_API = STRAPI_NEWS_LISTS_URL;

export type NewsListFilter = {
  q?: string;
  year?: string;
  month?: string;
  page: number;
};

export function buildNewsListStrapiUrl(filters: NewsListFilter): string {
  const { q = "", year = "", month = "", page } = filters;
  const params = new URLSearchParams();
  params.set("pagination[page]", String(Math.max(1, page)));
  params.set("pagination[pageSize]", String(NEWS_LIST_PAGE_SIZE));
  params.set("sort[0]", "date:desc");
  params.set("populate", "*");
  if (q.trim()) {
    params.set("filters[$or][0][title][$containsi]", q.trim());
    params.set("filters[$or][1][text][$containsi]", q.trim());
  }
  if (year && month) {
    const mm = String(month).padStart(2, "0");
    params.set("filters[date][$gte]", `${year}-${mm}-01`);
    const nextMonth = new Date(Date.UTC(Number(year), Number(mm) - 1, 1));
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const ny = nextMonth.getUTCFullYear();
    const nm = String(nextMonth.getUTCMonth() + 1).padStart(2, "0");
    params.set("filters[date][$lt]", `${ny}-${nm}-01`);
  } else if (year) {
    params.set("filters[date][$contains]", String(year));
  } else if (month) {
    const mm = String(month).padStart(2, "0");
    params.set("filters[date][$contains]", `-${mm}-`);
  }
  return `${NEWS_API}?${params.toString()}`;
}
