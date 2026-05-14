"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NewsEventsGridClient from "@/components/news/NewsEventsGridClient";

function monthName(monthNum) {
  const dt = new Date(`2000-${String(monthNum).padStart(2, "0")}-01T00:00:00Z`);
  return dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

async function fetchNewsPage(filters) {
  const params = new URLSearchParams();
  params.set("page", "1");
  const q = (filters.q || "").trim();
  const month = (filters.month || "").trim();
  const year = (filters.year || "").trim();
  if (q) params.set("q", q);
  if (month) params.set("month", month);
  if (year) params.set("year", year);

  const res = await fetch(`/api/news-events/more?${params.toString()}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(j.items)) {
    return { items: [], pageCount: 1 };
  }
  return {
    items: j.items,
    pageCount: Math.max(1, Number(j.pageCount ?? 1)),
  };
}

/**
 * Filters + grid stay on `/news-events` — no `?q=` in the browser (dharmanoderun-style).
 * Search box updates results after a short pause while typing; month/year apply immediately.
 */
export default function NewsEventsBrowseClient({
  initialItems,
  initialPageCount,
  months: monthOptions,
  years: yearOptions,
}) {
  const [q, setQ] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [items, setItems] = useState(initialItems);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [loading, setLoading] = useState(false);
  /** `null` | `'month'` | `'year'` — legacy `news-events.html` UL dropdowns */
  const [openDropdown, setOpenDropdown] = useState(null);
  const filtersRef = useRef({ q: "", month: "", year: "" });
  const filtersTouched = useRef(false);
  const filterBarRef = useRef(null);

  filtersRef.current = { q, month, year };
  const filters = { q, month, year };

  const refresh = useCallback(async (next) => {
    setLoading(true);
    try {
      const { items: nextItems, pageCount: nextCount } = await fetchNewsPage(next);
      setItems(nextItems);
      setPageCount(nextCount);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Debounced search while typing — does not run on first paint */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!filtersTouched.current) return;
      void refresh(filtersRef.current);
    }, 380);
    return () => window.clearTimeout(t);
  }, [q, refresh]);

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

  const applyMonth = useCallback(
    (v) => {
      filtersTouched.current = true;
      setMonth(v);
      void refresh({ q, month: v, year });
      setOpenDropdown(null);
    },
    [q, year, refresh],
  );

  const applyYear = useCallback(
    (v) => {
      filtersTouched.current = true;
      setYear(v);
      void refresh({ q, month, year: v });
      setOpenDropdown(null);
    },
    [q, month, refresh],
  );

  return (
    <>
      <div className="container">
        <div className="row">
          <div className="col-md-4 col-sm-4 col-xs-12">
            <div className="dharma-sun">
              <img src="/frontend/img/sun.png" alt="News" className="img-responsive" />
            </div>
          </div>
          <div className="col-md-8 col-sm-8 col-xs-12">
            <form
              className="news-search"
              onSubmit={(e) => {
                e.preventDefault();
                filtersTouched.current = true;
                void refresh({ q, month, year });
              }}
            >
              <div className="search-movie dh-relative">
                <div className="search-img">
                  <img src="/frontend/img/search.png" alt="" />
                </div>
                <input
                  type="search"
                  autoComplete="off"
                  inputMode="search"
                  enterKeyHint="search"
                  className="search-date"
                  placeholder="Search"
                  value={q}
                  onChange={(e) => {
                    filtersTouched.current = true;
                    setQ(e.target.value);
                  }}
                  aria-busy={loading}
                />
              </div>
              <div ref={filterBarRef} className="mt15 mobile-text-center">
                <div className="display-inline date-select">
                  <div className="dropdown custom-dropdown">
                    <button
                      type="button"
                      id="news-events-month-toggle"
                      className="dropdown-toggle"
                      aria-haspopup="true"
                      aria-expanded={openDropdown === "month"}
                      onClick={() => setOpenDropdown((o) => (o === "month" ? null : "month"))}
                    >
                      <span>{month ? monthName(month) : "Month"}</span>
                      <img src="/frontend/img/select-arrow.png" alt="" decoding="async" />
                    </button>
                    {openDropdown === "month" ?
                      <ul
                        className="dropdown-menu show"
                        aria-labelledby="news-events-month-toggle"
                        role="menu"
                      >
                        <li role="presentation">
                          <button
                            type="button"
                            className="news-events-dropdown__item"
                            role="menuitem"
                            onClick={() => applyMonth("")}
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
                              onClick={() => applyMonth(m)}
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
                      id="news-events-year-toggle"
                      className="dropdown-toggle"
                      aria-haspopup="true"
                      aria-expanded={openDropdown === "year"}
                      onClick={() => setOpenDropdown((o) => (o === "year" ? null : "year"))}
                    >
                      <span>{year || "Year"}</span>
                      <img src="/frontend/img/select-arrow.png" alt="" decoding="async" />
                    </button>
                    {openDropdown === "year" ?
                      <ul
                        className="dropdown-menu show"
                        aria-labelledby="news-events-year-toggle"
                        role="menu"
                      >
                        <li role="presentation">
                          <button
                            type="button"
                            className="news-events-dropdown__item"
                            role="menuitem"
                            onClick={() => applyYear("")}
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
                              onClick={() => applyYear(y)}
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
          </div>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <div className="all-movies custom-box mob-mt-top" style={{ minHeight: "400px" }}>
                {loading && items.length === 0 ?
                  <p className="text-center text-muted py-4 mb-0" role="status">
                    Loading…
                  </p>
                : null}
                {!loading && items.length === 0 ?
                  <div>
                    <center>
                      <strong>
                        <h1>No news Found</h1>
                      </strong>
                    </center>
                  </div>
                : null}
                {items.length > 0 ?
                  <>
                    {loading ?
                      <p className="text-center text-muted small py-2 mb-0" role="status">
                        Updating…
                      </p>
                    : null}
                    <NewsEventsGridClient items={items} pageCount={pageCount} filters={filters} />
                  </>
                : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
