"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { resolveUploadUrl } from "@/lib/media";

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

function relatedThumb(src) {
  if (!src || typeof src !== "string") return undefined;
  return resolveUploadUrl(src) ?? src;
}

/** Legacy `news-detail.html` — `.news-search` + `.search-movie` + `.search-date` + filters. */
function NewsSearchToolbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  function applyFilters() {
    const q = new URLSearchParams();
    if (search.trim()) q.set("q", search.trim());
    if (month) q.set("month", month);
    if (year) q.set("year", year);
    const s = q.toString();
    router.push(s ? `/news-events?${s}` : "/news-events");
  }

  return (
    <div className="news-search">
      <div className="search-movie dh-relative">
        <div className="search-img">
          <img src="/frontend/img/search.png" alt="" />
        </div>
        <input
          type="search"
          name="news-search-q"
          className="search-date"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilters();
          }}
          autoComplete="off"
        />
      </div>
      <div className="mt15 mobile-text-center">
        <div className="display-inline date-select">
          <select
            className="news-events-filters__select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Month"
          >
            {MONTHS.map((m) => (
              <option key={m.v || "m"} value={m.v}>
                {m.l}
              </option>
            ))}
          </select>
        </div>
        <div className="display-inline date-select ml15">
          <select
            className="news-events-filters__select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label="Year"
          >
            {YEARS.map((y) => (
              <option key={y.v || "y"} value={y.v}>
                {y.l}
              </option>
            ))}
          </select>
        </div>
        <div className="btn-go display-inline ml15">
          <button type="button" onClick={applyFilters}>
            Go
          </button>
        </div>
      </div>
    </div>
  );
}

export function NewsArticleView({ article, related = [] }) {
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
            <NewsSearchToolbar />
          </div>
        </div>
      </div>

      <section className="news-events-detail__article-section">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="movie-inside-curve m16-top" id="top-scroll" />
              <div className="movie-inner-bg mrgin-20 news-detail-card">
                <h1 className="font-karla text-capitalize color-black margin0 news-detail-title">
                  {article.title}
                </h1>
                {dateLabel ? (
                  <span className="color-light-grey top-set news-detail-date">
                    {dateLabel}
                  </span>
                ) : null}

                {bannerSrc ? (
                  <div className="banner-news">
                    <img
                      src={bannerSrc}
                      alt=""
                      className="img-responsive width100"
                    />
                  </div>
                ) : null}

                {article.html ? (
                  <div
                    className="news-data news-detail-body"
                    dangerouslySetInnerHTML={{ __html: article.html }}
                  />
                ) : null}

                {article.link ? (
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
                ) : null}
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

              {related.length > 0 ? (
                <div className="pb40 related-articles-section">
                  <h1 className="color-white font-hammersmith text-up line45 margin0 ml15">
                    Related Articles
                  </h1>
                  <div className="mobs-slider nav-cl mob-top-em">
                    <Swiper
                      modules={[Pagination]}
                      slidesPerView={1}
                      spaceBetween={20}
                      loop={related.length > 3}
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
                              href={`/news-events/${item._id}`}
                              className="text-decoration-none text-reset d-block"
                            >
                              <div className="black-bg makePointer h-100 related-article-card">
                                {thumb ? (
                                  <div className="img-animate">
                                    <img
                                      src={thumb}
                                      alt=""
                                      className="img-responsive width100 related-article-image"
                                    />
                                  </div>
                                ) : null}
                                <div className="padd10 related-article-copy">
                                  <div className="news-title mt10 h60">
                                    <h4 className="margin0 related-article-title">
                                      {item.title}
                                    </h4>
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
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

