"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

function formatDate(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

function appendDeduped(prev, next) {
  const seen = new Set(
    prev
      .map((x) => String(x._id || "").trim())
      .filter(Boolean),
  );
  const out = [...prev];
  for (const it of next) {
    const id = String(it._id || "").trim();
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    out.push(it);
  }
  return out;
}

function filtersKey(f) {
  return `${f.q || ""}|${f.month || ""}|${f.year || ""}`;
}

/**
 * @param {object} props
 * @param {import("@/lib/server/strapiNewsList").StrapiNewsGridItem[]} props.items — first page from server
 * @param {number} [props.pageCount] — Strapi `meta.pagination.pageCount` (enables infinite scroll when > 1)
 * @param {{ q?: string; month?: string; year?: string }} [props.filters] — must match URL for `/api/news-events/more`
 */
export default function NewsEventsGridClient({ items: initialItems, pageCount = 1, filters = {} }) {
  const gridRef = useRef(null);
  const sentinelRef = useRef(null);
  const fetchingRef = useRef(false);
  const [items, setItems] = useState(initialItems);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const fk = filtersKey(filters);

  useEffect(() => {
    setItems(initialItems);
    setLoadedPage(1);
  }, [initialItems, fk]);

  const loadNext = useCallback(async () => {
    const nextPage = loadedPage + 1;
    if (nextPage > pageCount || loading || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      const q = (filters.q || "").trim();
      const month = (filters.month || "").trim();
      const year = (filters.year || "").trim();
      if (q) params.set("q", q);
      if (month) params.set("month", month);
      if (year) params.set("year", year);
      const res = await fetch(`/api/news-events/more?${params.toString()}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(j.items)) return;
      setItems((prev) => appendDeduped(prev, j.items));
      setLoadedPage(nextPage);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [loadedPage, pageCount, loading, filters]);

  /* Reveal animation — same as before; re-run when `items` grows (infinite scroll) */
  useEffect(() => {
    const root = gridRef.current;
    if (!root) return undefined;

    const cards = Array.from(root.querySelectorAll(".masonry-brick"));
    if (cards.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [items]);

  /* Load next page when sentinel enters view */
  useEffect(() => {
    if (pageCount <= 1 || loadedPage >= pageCount) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && !fetchingRef.current && loadedPage < pageCount) {
          loadNext();
        }
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageCount, loadedPage, loading, loadNext]);

  return (
    <>
      <div ref={gridRef} className="movie-news-grid movie-news-grid--reveal margin-auto">
        {items.map((item, index) => (
          <article
            className="masonry-brick masonry-link"
            key={item._id ? item._id : `news-${index}`}
            style={{ transitionDelay: `${Math.min(index % 12, 11) * 45}ms` }}
          >
            <Link href={`/news-events/${encodeURIComponent(item.slug || item._id)}`}>
              <div className="masonry-box">
                <div className="img-animate">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="img-responsive"
                      loading={index < 6 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="padd10">
                  <div className="news-title">
                    <h4 className="margin0">{item.title}</h4>
                  </div>
                  <div className="news-date">
                    <span className="f12">{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
      {pageCount > 1 && loadedPage < pageCount ? (
        <div
          ref={sentinelRef}
          className="news-events-scroll-sentinel"
          aria-hidden
          style={{ height: "1px", marginTop: "8px" }}
        />
      ) : null}
      {loading ? (
        <p className="text-center text-muted small py-3 mb-0" role="status">
          Loading…
        </p>
      ) : null}
    </>
  );
}
