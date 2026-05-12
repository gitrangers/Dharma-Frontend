import { resolveUploadUrl } from "@/lib/media";
import NewsEventsGridClient from "@/components/news/NewsEventsGridClient";
import { fetchJsonWithRevalidate } from "@/lib/server/fetchJson";

const NEWS_API = "https://dharmacms2.tinglabs.in/api/news-lists";
const PAGE_SIZE = 100;
/** Data cache: ISR revalidate (seconds) for news list + filter options */
const NEWS_REVALIDATE_SEC = 120;

function toSingle(value) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function toRecord(v) {
  return v && typeof v === "object" ? v : {};
}

function pickMediaUrl(media) {
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

function mapNewsItem(item) {
  const source = toRecord(item?.attributes || item);
  const rawImage = pickMediaUrl(source.image) || pickMediaUrl(source.banner) || "";
  return {
    _id: String(source.documentId || source.id || item?.id || ""),
    title: String(source.title || ""),
    date: source.date || "",
    text: String(source.text || ""),
    imageUrl: resolveUploadUrl(rawImage) || rawImage || "",
  };
}

/** Same Strapi id can appear on multiple pages if sort ties (e.g. same `date`). */
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

function monthName(monthNum) {
  const dt = new Date(`2000-${String(monthNum).padStart(2, "0")}-01T00:00:00Z`);
  return dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

function buildListUrl({ q, year, month, page }) {
  const params = new URLSearchParams();
  params.set("pagination[page]", String(page));
  params.set("pagination[pageSize]", String(PAGE_SIZE));
  params.set("sort[0]", "date:desc");
  params.set("populate", "*");
  if (q) {
    params.set("filters[$or][0][title][$containsi]", q);
    params.set("filters[$or][1][text][$containsi]", q);
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

async function fetchNewsList(filters) {
  try {
    let page = 1;
    let totalPages = 1;
    const allItems = [];

    do {
      let json;
      try {
        json = await fetchJsonWithRevalidate(
          buildListUrl({ ...filters, page }),
          NEWS_REVALIDATE_SEC,
        );
      } catch {
        break;
      }
      const rows = Array.isArray(json?.data) ? json.data : [];
      allItems.push(...rows.map(mapNewsItem));
      totalPages = Number(json?.meta?.pagination?.pageCount || 1);
      page += 1;
    } while (page <= totalPages);

    return { items: dedupeNewsItemsById(allItems) };
  } catch {
    return { items: [] };
  }
}

async function fetchMonthYearOptions() {
  try {
    const params = new URLSearchParams();
    params.set("pagination[page]", "1");
    params.set("pagination[pageSize]", "5000");
    params.set("fields[0]", "date");
    let json;
    try {
      json = await fetchJsonWithRevalidate(
        `${NEWS_API}?${params.toString()}`,
        NEWS_REVALIDATE_SEC,
      );
    } catch {
      return { months: [], years: [] };
    }
    const months = new Set();
    const years = new Set();
    const rows = Array.isArray(json?.data) ? json.data : [];
    rows.forEach((entry) => {
      const source = toRecord(entry?.attributes || entry);
      const raw = source.date;
      if (!raw) return;
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) return;
      months.add(String(dt.getUTCMonth() + 1).padStart(2, "0"));
      years.add(String(dt.getUTCFullYear()));
    });
    return {
      months: Array.from(months).sort((a, b) => Number(a) - Number(b)),
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
    };
  } catch {
    return { months: [], years: [] };
  }
}

export default async function NewsEventsPage({ searchParams }) {
  const params = await searchParams;
  const q = toSingle(params?.q).trim();
  const month = toSingle(params?.month);
  const year = toSingle(params?.year);

  const [list, options] = await Promise.all([
    fetchNewsList({ q, year, month }),
    fetchMonthYearOptions(),
  ]);

  return (
    <section className="news-events-page bg-primary min-vh-content">
      <div className="container">
        <div className="row">
          <div className="col-md-4 col-sm-4 col-xs-12">
            <div className="dharma-sun">
              <img src="/frontend/img/sun.png" alt="News" className="img-responsive" />
            </div>
          </div>
          <div className="col-md-8 col-sm-8 col-xs-12">
            <form className="news-search" method="get" action="/news-events">
              <div className="search-movie dh-relative">
                <div className="search-img">
                  <img src="/frontend/img/search.png" alt="Search" />
                </div>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  className="search-date"
                  placeholder="Search"
                />
              </div>
              <div className="mt15 mobile-text-center">
                <div className="display-inline date-select">
                  <select
                    className="news-events-filters__select"
                    defaultValue={month}
                    name="month"
                    aria-label="Month"
                  >
                    <option value="">Month</option>
                    {options.months.map((m) => (
                      <option key={m} value={m}>
                        {monthName(m)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="display-inline date-select ml15">
                  <select
                    className="news-events-filters__select"
                    defaultValue={year}
                    name="year"
                    aria-label="Year"
                  >
                    <option value="">Year</option>
                    {options.years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="btn-go display-inline ml15">
                  <button type="submit">Go</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <div className="all-movies custom-box mob-mt-top" style={{ minHeight: "400px" }}>
                {list.items.length > 0 ? (
                  <NewsEventsGridClient items={list.items} />
                ) : (
                  <div>
                    <center>
                      <strong>
                        <h1>No news Found</h1>
                      </strong>
                    </center>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
