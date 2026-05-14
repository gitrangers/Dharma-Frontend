"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { resolveUploadUrl } from "@/lib/media";
import NewsEventsGridClient from "@/components/news/NewsEventsGridClient";

const MONTHS = [
  { v: "", l: "Month" },
  { v: "1", l: "Jan" },
  { v: "2", l: "Feb" },
  { v: "3", l: "Mar" },
  { v: "4", l: "Apr" },
  { v: "5", l: "May" },
  { v: "6", l: "Jun" },
  { v: "7", l: "Jul" },
  { v: "8", l: "Aug" },
  { v: "9", l: "Sep" },
  { v: "10", l: "Oct" },
  { v: "11", l: "Nov" },
  { v: "12", l: "Dec" },
];

const YEARS = (() => {
  const y = new Date().getUTCFullYear();
  const out = [{ v: "", l: "Year" }];
  for (let i = y + 1; i >= 1990; i -= 1) {
    out.push({ v: String(i), l: String(i) });
  }
  return out;
})();

function formatNewsDateUtc(iso) {
  if (!iso) return "";
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(dt);
  } catch {
    return "";
  }
}

function monthName(monthNum) {
  const dt = new Date(`2000-${String(monthNum).padStart(2, "0")}-01T00:00:00Z`);
  return dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

function relatedThumb(src) {
  if (!src || typeof src !== "string") return undefined;
  return resolveUploadUrl(src) ?? src;
}

/**
 * Angular `NewsDetailCtrl` + `news-detail.html`:
 * filters stay on the **same route** — `doSearch()` toggles `getSearchNews` and loads masonry vs article.
 */
function NewsSearchToolbar({
  q,
  setQ,
  month,
  year,
  crossdisplay,
  onCloseCross,
  onGo,
  onSearchCommitted,
  onApplyMonth,
  onApplyYear,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const filterBarRef = useRef(null);

  const monthOptions = useMemo(() => MONTHS.filter((m) => m.v).map((m) => m.v), []);
  const yearOptions = useMemo(() => YEARS.filter((y) => y.v).map((y) => y.v), []);

  useEffect(() => {
    if (!openDropdown) return undefined;
    const onDoc = (e) => {
      const el = filterBarRef.current;
      if (el && !el.contains(e.target)) setOpenDropdown(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [openDropdown]);

  return (
    <form
      className="news-search"
      onSubmit={(e) => {
        e.preventDefault();
        onGo();
      }}
    >
      <div className="search-movie dh-relative">
        <div className="search-img">
          <img src="/frontend/img/search.png" alt="" />
        </div>
        <input
          type="search"
          name="news-search-q"
          className="search-date"
          placeholder="Search"
          value={q}
          onChange={(e) => {
            onSearchCommitted();
            setQ(e.target.value);
          }}
          autoComplete="off"
        />
        {crossdisplay ?
          <button
            type="button"
            className="search-img2 bg-transparent border-0 p-0"
            aria-label="Clear search text"
            onClick={onCloseCross}
          >
            <img src="/frontend/img/error3.png" alt="" />
          </button>
        : null}
      </div>
      <div ref={filterBarRef} className="mt15 mobile-text-center">
        <div className="display-inline date-select">
          <div className="dropdown custom-dropdown">
            <button
              type="button"
              id="news-detail-month-toggle"
              className="dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={openDropdown === "month"}
              onClick={() => setOpenDropdown((o) => (o === "month" ? null : "month"))}
            >
              <span>{month ? monthName(month) : "Month"}</span>
              <img src="/frontend/img/select-arrow.png" alt="" decoding="async" />
            </button>
            {openDropdown === "month" ?
              <ul className="dropdown-menu show" aria-labelledby="news-detail-month-toggle" role="menu">
                <li role="presentation">
                  <button
                    type="button"
                    className="news-events-dropdown__item"
                    role="menuitem"
                    onClick={() => {
                      onApplyMonth("");
                      setOpenDropdown(null);
                    }}
                  >
                    Month
                  </button>
                </li>
                {monthOptions.map((m) => (
                  <li key={m} role="presentation">
                    <button
                      type="button"
                      className="news-events-dropdown__item"
                      role="menuitem"
                      onClick={() => {
                        onApplyMonth(m);
                        setOpenDropdown(null);
                      }}
                    >
                      {monthName(m)}
                    </button>
                  </li>
                ))}
              </ul>
            : null}
          </div>
        </div>
        <div className="display-inline date-select ml15">
          <div className="dropdown custom-dropdown">
            <button
              type="button"
              id="news-detail-year-toggle"
              className="dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={openDropdown === "year"}
              onClick={() => setOpenDropdown((o) => (o === "year" ? null : "year"))}
            >
              <span>{year || "Year"}</span>
              <img src="/frontend/img/select-arrow.png" alt="" decoding="async" />
            </button>
            {openDropdown === "year" ?
              <ul className="dropdown-menu show" aria-labelledby="news-detail-year-toggle" role="menu">
                <li role="presentation">
                  <button
                    type="button"
                    className="news-events-dropdown__item"
                    role="menuitem"
                    onClick={() => {
                      onApplyYear("");
                      setOpenDropdown(null);
                    }}
                  >
                    Year
                  </button>
                </li>
                {yearOptions.map((y) => (
                  <li key={y} role="presentation">
                    <button
                      type="button"
                      className="news-events-dropdown__item"
                      role="menuitem"
                      onClick={() => {
                        onApplyYear(y);
                        setOpenDropdown(null);
                      }}
                    >
                      {y}
                    </button>
                  </li>
                ))}
              </ul>
            : null}
          </div>
        </div>
        <div className="btn-go display-inline ml15">
          <button type="submit" className="btn">
            Go
          </button>
        </div>
      </div>
    </form>
  );
}

export function NewsArticleView({ article, related = [] }) {
  /** Mirrors Angular `filter.search`, `filter.month`, `filter.year`, `getSearchNews`, `crossdisplay`. */
  const [q, setQ] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [getSearchNews, setGetSearchNews] = useState(false);
  const [crossdisplay, setCrossdisplay] = useState(false);
  const [noNewsFound, setNoNewsFound] = useState(false);
  const [gridItems, setGridItems] = useState([]);
  const [gridPageCount, setGridPageCount] = useState(1);
  const [gridLoading, setGridLoading] = useState(false);

  const filtersRef = useRef({ q: "", month: "", year: "" });
  filtersRef.current = { q, month, year };

  /** Angular fires `doSearch()` from `ng-change` on search only — not on initial paint. */
  const searchEdited = useRef(false);
  const markSearchEdited = useCallback(() => {
    searchEdited.current = true;
  }, []);

  /** Same behaviour as `/news-events` browse: Month/Year apply immediately (`applyMonth` / `applyYear`). */
  const applyFiltersSnapshot = useCallback(async (snap) => {
    const trimmed = String(snap.q ?? "").trim();
    const mm = String(snap.month ?? "").trim();
    const yy = String(snap.year ?? "").trim();
    if (!trimmed && !mm && !yy) {
      setGetSearchNews(false);
      setCrossdisplay(false);
      setNoNewsFound(false);
      setGridItems([]);
      setGridPageCount(1);
      return;
    }
    setGetSearchNews(true);
    setCrossdisplay(!!trimmed);
    setGridItems([]);
    setNoNewsFound(false);
    setGridLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      if (trimmed) params.set("q", trimmed);
      if (mm) params.set("month", mm);
      if (yy) params.set("year", yy);
      const res = await fetch(`/api/news-events/more?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      const items = Array.isArray(j.items) ? j.items : [];
      const pageCount = Math.max(1, Number(j.pageCount ?? 1));
      setGridItems(items);
      setGridPageCount(pageCount);
      setNoNewsFound(items.length === 0);
    } finally {
      setGridLoading(false);
    }
  }, []);

  const handleApplyMonth = useCallback(
    (v) => {
      const next = String(v ?? "").trim();
      setMonth(next);
      void applyFiltersSnapshot({ q, month: next, year });
    },
    [q, year, applyFiltersSnapshot],
  );

  const handleApplyYear = useCallback(
    (v) => {
      const next = String(v ?? "").trim();
      setYear(next);
      void applyFiltersSnapshot({ q, month, year: next });
    },
    [q, month, applyFiltersSnapshot],
  );

  const doSearch = useCallback(async () => {
    const { q: qq, month: mm, year: yy } = filtersRef.current;
    await applyFiltersSnapshot({ q: qq, month: mm, year: yy });
  }, [applyFiltersSnapshot]);

  const doSearchRef = useRef(doSearch);
  doSearchRef.current = doSearch;

  useEffect(() => {
    if (!searchEdited.current) return undefined;
    const t = window.setTimeout(() => {
      void doSearchRef.current();
    }, 380);
    return () => window.clearTimeout(t);
  }, [q]);

  /** Angular `closeCross`: clear text; keep month/year → re-run filtered list, else restore article view. */
  const closeCross = useCallback(async () => {
    setCrossdisplay(false);
    searchEdited.current = false;
    const mm = filtersRef.current.month;
    const yy = filtersRef.current.year;
    setQ("");
    await applyFiltersSnapshot({ q: "", month: mm, year: yy });
  }, [applyFiltersSnapshot]);

  const onGoSubmit = useCallback(() => {
    void doSearch();
  }, [doSearch]);

  const gridFilters = useMemo(
    () => ({
      q: q.trim(),
      month,
      year,
    }),
    [q, month, year],
  );

  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareUrl(window.location.href);
  }, []);

  const fbHref = useMemo(
    () =>
      shareUrl
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        : "#",
    [shareUrl],
  );
  const twHref = useMemo(
    () =>
      shareUrl
        ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`
        : "#",
    [shareUrl],
  );

  const bannerSrc = article.bannerUrl || article.imageUrl || "";
  const dateLabel = formatNewsDateUtc(article.dateIso);

  return (
    <section className="news-events-detail">
      <div className="container">
        <div className="row news-events-detail__hero-row">
          <div className="col-md-4 col-sm-4 col-12">
            <div className="dharma-sun">
              <img
                src="/frontend/img/sun.png"
                alt=""
                className="img-responsive width100"
              />
            </div>
          </div>
          <div className="col-md-8 col-sm-8 col-12">
            <NewsSearchToolbar
              q={q}
              setQ={setQ}
              month={month}
              year={year}
              crossdisplay={crossdisplay}
              onCloseCross={closeCross}
              onGo={onGoSubmit}
              onSearchCommitted={markSearchEdited}
              onApplyMonth={handleApplyMonth}
              onApplyYear={handleApplyYear}
            />
          </div>
        </div>
      </div>

      {!getSearchNews ?
        <section className="news-events-detail__article-section">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="movie-inside-curve m16-top" id="top-scroll" />
                <div className="movie-inner-bg mrgin-20 news-detail-card">
                  <h1 className="font-karla text-capitalize color-black margin0 news-detail-title">
                    {article.title}
                  </h1>
                  {dateLabel ?
                    <span className="color-light-grey top-set news-detail-date">{dateLabel}</span>
                  : null}

                  {bannerSrc ?
                    <div className="banner-news">
                      <img src={bannerSrc} alt="" className="img-responsive width100" />
                    </div>
                  : null}

                  {article.html ?
                    <div
                      className="news-data news-detail-body"
                      dangerouslySetInnerHTML={{ __html: article.html }}
                    />
                  : null}

                  {article.link ?
                    <p className="mt-3 mb-0">
                      <a
                        href={article.link}
                        className="color-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open external link
                      </a>
                    </p>
                  : null}
                </div>

                <div className="share-section news-share-section mt15 pb40 text-c-m">
                  <h4 className="color-white font-bold font-karla display-inline dis-bl">
                    Share this article on
                  </h4>
                  <div className="display-inline">
                    <a
                      href={fbHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                    >
                      <button type="button" name="button" className="news-share-btn">
                        <i className="fa-brands fa-facebook-f" aria-hidden />
                        facebook
                      </button>
                    </a>
                  </div>
                  <div className="display-inline">
                    <a
                      href={twHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on X"
                    >
                      <button type="button" name="button" className="news-share-btn">
                        <i className="fa-brands fa-twitter" aria-hidden />
                        twitter
                      </button>
                    </a>
                  </div>
                </div>

                {related.length > 0 ?
                  <div className="pb40 related-articles-section">
                    <h1 className="color-white font-hammersmith text-up line45 margin0 ml15">
                      Related Articles
                    </h1>
                    <div className="mobs-slider nav-cl mob-top-em">
                      <Swiper
                        modules={[Pagination, Autoplay]}
                        slidesPerView={1}
                        spaceBetween={20}
                        loop={related.length > 3}
                        autoplay={
                          related.length > 3
                            ? {
                                delay: 4500,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                              }
                            : false
                        }
                        pagination={{ clickable: true }}
                        breakpoints={{
                          576: { slidesPerView: 1.4 },
                          768: { slidesPerView: 2.1 },
                          992: { slidesPerView: 3 },
                        }}
                        className="related-news-swiper"
                      >
                        {related.map((item) => {
                          const thumb = relatedThumb(item.imageUrl);
                          return (
                            <SwiperSlide key={item._id}>
                              <Link
                                href={`/news-events/${encodeURIComponent(item.slug || item._id)}`}
                                className="text-decoration-none text-reset d-block"
                              >
                                <div className="black-bg makePointer h-100 related-article-card">
                                  {thumb ?
                                    <div className="img-animate">
                                      <img
                                        src={thumb}
                                        alt=""
                                        className="img-responsive width100 related-article-image"
                                      />
                                    </div>
                                  : null}
                                  <div className="padd10 related-article-copy">
                                    <div className="news-title mt10 h60">
                                      <h4 className="margin0 related-article-title">{item.title}</h4>
                                    </div>
                                    <div className="news-date">
                                      <span className="f12 related-article-date">
                                        {formatNewsDateUtc(item.dateIso)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </SwiperSlide>
                          );
                        })}
                      </Swiper>
                    </div>
                  </div>
                : null}
              </div>
            </div>
          </div>
        </section>
      : (
        <section className="news-events-detail__article-section news-events-detail__search-results-shell">
          <div className="news-events-page news-events-detail__listing-skin">
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <div className="all-movies custom-box mob-mt-top" style={{ minHeight: "400px" }}>
                    {gridLoading && gridItems.length === 0 ?
                      <p className="text-center text-muted py-4 mb-0" role="status">
                        Loading…
                      </p>
                    : null}

                    {!gridLoading && noNewsFound ?
                      <div>
                        <center>
                          <strong>
                            <h1>No news Found</h1>
                          </strong>
                        </center>
                      </div>
                    : null}

                    {gridItems.length > 0 ?
                      <NewsEventsGridClient
                        key={`${gridFilters.q}|${gridFilters.month}|${gridFilters.year}`}
                        items={gridItems}
                        pageCount={gridPageCount}
                        filters={gridFilters}
                      />
                    : null}

                    {gridLoading && gridItems.length > 0 ?
                      <p className="text-center text-muted small py-2 mb-0" role="status">
                        Updating…
                      </p>
                    : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

