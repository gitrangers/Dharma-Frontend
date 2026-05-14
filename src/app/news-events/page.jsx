import NewsEventsBrowseClient from "@/components/news/NewsEventsBrowseClient";
import { buildNewsListStrapiUrl } from "@/lib/newsEventsListQuery";
import { fetchJsonWithRevalidate } from "@/lib/server/fetchJson";
import {
  mapStrapiNewsListItem,
  NEWS_LIST_REVALIDATE_SEC,
  STRAPI_NEWS_LISTS_URL,
} from "@/lib/server/strapiNewsList";

const NEWS_API = STRAPI_NEWS_LISTS_URL;
const NEWS_REVALIDATE_SEC = NEWS_LIST_REVALIDATE_SEC;

function toRecord(v) {
  return v && typeof v === "object" ? v : {};
}

function dedupeNewsItemsById(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const id = String(it._id || "").trim();
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(it);
  }
  return out;
}

async function fetchNewsList(filters) {
  try {
    const json = await fetchJsonWithRevalidate(buildNewsListStrapiUrl(filters), NEWS_REVALIDATE_SEC);
    const rows = Array.isArray(json?.data) ? json.data : [];
    const items = dedupeNewsItemsById(rows.map(mapStrapiNewsListItem));
    const pageCount = Number(json?.meta?.pagination?.pageCount ?? 1);
    return { items, pageCount };
  } catch {
    return { items: [], pageCount: 1 };
  }
}

/** Strapi usually caps `pageSize` (often 100). A single huge request only sees one page — years then miss older posts. */
const MONTH_YEAR_PAGE_SIZE = 100;
const MONTH_YEAR_MAX_PAGES = 500;

function collectDatesFromRows(rows, months, years) {
  rows.forEach((entry) => {
    const source = toRecord(entry?.attributes || entry);
    const raw = source.date;
    if (!raw) return;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return;
    months.add(String(dt.getUTCMonth() + 1).padStart(2, "0"));
    years.add(String(dt.getUTCFullYear()));
  });
}

async function fetchMonthYearOptions() {
  try {
    const months = new Set();
    const years = new Set();
    let page = 1;

    while (page <= MONTH_YEAR_MAX_PAGES) {
      const params = new URLSearchParams();
      params.set("pagination[page]", String(page));
      params.set("pagination[pageSize]", String(MONTH_YEAR_PAGE_SIZE));
      params.set("fields[0]", "date");
      params.set("sort[0]", "date:desc");

      let json;
      try {
        json = await fetchJsonWithRevalidate(`${NEWS_API}?${params.toString()}`, NEWS_REVALIDATE_SEC);
      } catch {
        if (page === 1) return { months: [], years: [] };
        break;
      }

      const rows = Array.isArray(json?.data) ? json.data : [];
      if (!rows.length) break;

      collectDatesFromRows(rows, months, years);

      const totalPages = Number(json?.meta?.pagination?.pageCount);
      const parsedPageCount = Number.isFinite(totalPages) && totalPages >= 1 ? totalPages : null;
      const lastPage = parsedPageCount != null ? page >= parsedPageCount : rows.length < MONTH_YEAR_PAGE_SIZE;

      if (lastPage) break;
      page += 1;
    }

    return {
      months: Array.from(months).sort((a, b) => Number(a) - Number(b)),
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
    };
  } catch {
    return { months: [], years: [] };
  }
}

/** News listing — filtering is client-side via `/api/news-events/more` so the URL stays `/news-events`. */
export default async function NewsEventsPage() {
  const [list, options] = await Promise.all([
    fetchNewsList({ q: "", year: "", month: "", page: 1 }),
    fetchMonthYearOptions(),
  ]);

  return (
    <section className="news-events-page min-vh-content">
      <NewsEventsBrowseClient
        initialItems={list.items}
        initialPageCount={list.pageCount}
        months={options.months}
        years={options.years}
      />
    </section>
  );
}
