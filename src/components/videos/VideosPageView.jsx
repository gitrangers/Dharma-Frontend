"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { VideosSearchBar } from "@/components/videos/VideosSearchBar";
import { resolveMovieUrlSlug } from "@/lib/movieModel";
import { resolveUploadUrl } from "@/lib/media";
import {
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeThumbnailUrlMax,
  youtubeVideoId,
  youtubeWatchUrl,
} from "@/lib/youtube";
import { resolveMovieTitleFromTvRow } from "@/lib/videosTitles";

import "swiper/css";
import "swiper/css/navigation";

/** Main /videos listing: newest-first by `order`, only preview this many clips per movie in the row swiper. */
const SLIDER_PREVIEW_PER_MOVIE = 4;

function shorten(s, max) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 3))}...`;
}

function rowMatchesQuery(row, q) {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  const title = String(row.title ?? "").toLowerCase();
  const movieName = String(row.movie?.name ?? "").toLowerCase();
  const tags = Array.isArray(row.tag) ? row.tag : row.tag != null ? [row.tag] : [];
  const tagHit = tags.some((t) => String(t).toLowerCase().includes(n));
  return title.includes(n) || movieName.includes(n) || tagHit;
}

function sortRowsForSearch(rows) {
  return [...rows].sort((a, b) =>
    String(a.movie?.name ?? "").localeCompare(String(b.movie?.name ?? ""), undefined, {
      sensitivity: "base",
    })
  );
}

/** Stable buckets by Tv `movieKey`; headings prefer Movie/catalog names over embedded typos. */
function groupByMovieKey(rows, movieTitleLookups) {
  const order = [];
  const map = new Map();

  for (const row of rows) {
    const movieKey =
      typeof row.movieKey === "string" && row.movieKey.trim() ?
        row.movieKey.trim()
      : resolveMovieUrlSlug(row.movie ?? {});

    if (!map.has(movieKey)) {
      map.set(movieKey, { movieKey, items: [] });
      order.push(movieKey);
    }
    map.get(movieKey).items.push(row);
  }

  for (const g of map.values()) {
    g.items.sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0));
  }

  return order.map((movieKey) => {
    const g = map.get(movieKey);
    const sorted = g.items;
    const totalForMovie = sorted.length;
    const items = sorted.slice(0, SLIDER_PREVIEW_PER_MOVIE);
    const first = items[0];
    const movie = resolveMovieTitleFromTvRow(first, movieTitleLookups ?? null);
    return { movie, movieKey: g.movieKey, items, totalForMovie };
  });
}

/**
 * YouTube thumbnail dimensions:
 *   hqdefault  → 480 × 360 (4:3)
 *   maxresdefault → 1280 × 720 (16:9, may 404)
 * We declare 16:9 so the browser reserves space before the image loads → no CLS.
 */
const THUMB_W = 480;
const THUMB_H = 270;

function VideoTile({ item, eager = false, onOpen }) {
  const thumb =
    resolveUploadUrl(item.thumbnail) || youtubeThumbnailUrl(item.url) || "";
  const title = shorten(String(item.title ?? ""), 60);

  return (
    <div className="video-box">
      <div className="video-slide-img">
        <button
          type="button"
          className="dh-video-popup-trigger d-block w-100 text-start text-decoration-none border-0 bg-transparent p-0"
          aria-label={`Play — ${title}`}
          onClick={() => onOpen(item)}
        >
          <div className="img-animated">
            <div className="img-inside-box em-box hover-sec">
              {thumb ?
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  width={THUMB_W}
                  height={THUMB_H}
                  className="img-responsive width100"
                  loading={eager ? "eager" : "lazy"}
                  decoding="async"
                />
              : null}
            </div>
          </div>
          <div className="video-names mt10">
            <span className="color-white text-cap">{title}</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function VideoRowSwiper({ items, onOpen }) {
  const wrapRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="videos-tv-swiper-nav" ref={wrapRef}>
      <Swiper
        modules={[Navigation, ...(inView ? [Autoplay] : [])]}
        navigation
        loop={items.length > 3}
        {...(inView ? {
          autoplay: {
            delay: 4200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
        } : {})}
        slidesPerView={1.15}
        spaceBetween={12}
        breakpoints={{
          576: { slidesPerView: 2, spaceBetween: 14 },
          768: { slidesPerView: 3, spaceBetween: 16 },
          992: { slidesPerView: 4, spaceBetween: 14 },
        }}
        className="videos-tv-swiper"
      >
        {items.map((item, idx) => (
          <SwiperSlide key={`${youtubeVideoId(item.url)}-${idx}`}>
            <VideoTile item={item} eager={idx === 0} onOpen={onOpen} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function HeroSlideImage({ uploadSrc, videoUrl, eager }) {
  const maxres = youtubeThumbnailUrlMax(videoUrl);
  const hq = youtubeThumbnailUrl(videoUrl);
  const initial = uploadSrc || maxres || hq || "";
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    const next = uploadSrc || maxres || hq || "";
    setSrc(next);
  }, [uploadSrc, maxres, hq]);

  if (!src) return null;

  const tryFallback = () => {
    if (src === maxres && hq) setSrc(hq);
    else if (uploadSrc && src === uploadSrc && hq) setSrc(hq);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={1280}
      height={720}
      className="videos-hero-slide__img img-responsive width100 flexslider-slides-img"
      sizes="(max-width: 575px) 88vw, 78vw"
      loading={eager ? "eager" : "lazy"}
      {...(eager ? { fetchPriority: "high" } : {})}
      decoding={eager ? "sync" : "async"}
      draggable={false}
      onError={tryFallback}
    />
  );
}

/** Legacy dharma-tv: outline is SVG <rect>; navigation without HTML <button>/<a>. */
function VideosViewAllGraphic({ movieKey }) {
  const router = useRouter();
  const path = `/videos/${encodeURIComponent(movieKey)}`;

  const go = () => {
    router.push(path);
  };

  return (
    <svg
      className="videos-view-all-svg float-end"
      role="link"
      tabIndex={0}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`View all videos — ${movieKey.replace(/-/g, " ")}`}
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
    >
      {/*
        Match Angular template: `<rect x="0" y="0" fill="none" width="100%" height="100%"/>`
        + label inside the same SVG (no separate DOM text sibling).
       */}
      <rect className="videos-view-all-svg__frame" x="0" y="0" width="100%" height="100%" fill="none" />
      <text
        className="videos-view-all-svg__text font-hammersmith"
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="currentColor"
      >
        VIEW ALL
      </text>
    </svg>
  );
}

function MovieVideoBlock({ movie, movieKey, items, totalForMovie, onOpenVideo }) {
  const showSlider = totalForMovie > 3;

  return (
    <div className="upcoming-movie videos-movie-section search-movie-mar mx-auto w-100 pb-short">
      <div className="title videos-movie-section__title">
        <h1 className="ml-7 color-primary font-hammersmith line45 f55 text-up d-none d-md-block margin0">
          {movie}
        </h1>
        <h1 className="ml-7 color-primary font-hammersmith line45 f55 text-up d-md-none margin0">
          {shorten(movie, 20)}
        </h1>
      </div>
      <div className="upcoming-slider tv-all-slider text-shadow cl-flex tv-ain-tp">
        {showSlider ?
          <VideoRowSwiper items={items} onOpen={onOpenVideo} />
        : <div className="row g-3">
            {items.map((item, idx) => (
              <div key={`${movie}-${idx}`} className="col-6 col-md-3">
                <VideoTile item={item} eager={idx < 4} onOpen={onOpenVideo} />
              </div>
            ))}
          </div>
        }
        <div className="btn-view-all mt40 mobile-text-center w-100 videos-movie-view-all">
          <VideosViewAllGraphic movieKey={movieKey} />
        </div>
      </div>
    </div>
  );
}

function HeroSlider({ slides, onVideoOpen }) {
  const sorted = [...slides].sort(
    (a, b) => (Number(b.order) || 0) - (Number(a.order) || 0)
  );
  const [heroSwiper, setHeroSwiper] = useState(null);

  useEffect(() => {
    heroSwiper?.update();
  }, [heroSwiper, sorted.length]);

  useEffect(() => {
    const onResize = () => heroSwiper?.update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [heroSwiper]);

  if (!sorted.length) return null;

  const showNav = sorted.length > 1;

  return (
    <div className="no-ar video-player mt25 tv-all-slider marg-arrow mob-mt-15 videos-hero-player">
      <div className="videos-hero-rail search-movie-mar mx-auto w-100 position-relative">
        <div className="videos-hero-rail-inner position-relative w-100">
          {showNav ?
            <button
              type="button"
              className="videos-hero-outside-arrow videos-hero-outside-arrow--prev"
              aria-label="Previous slide"
              onClick={() => heroSwiper?.slidePrev()}
            />
          : null}

          <div className="videos-hero-swiper-shell w-100 min-w-0">
            <Swiper
              modules={[Autoplay]}
              loop={sorted.length > 1}
              onSwiper={(s) => setHeroSwiper(s)}
              observer
              observeParents
              watchSlidesProgress
              autoplay={{
                delay: 5500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              slidesPerView={1}
              spaceBetween={0}
              className="videos-hero-swiper w-100"
            >
              {sorted.map((s, i) => {
                const uploadSrc =
                  typeof s.image === "string" ? resolveUploadUrl(s.image) || "" : "";
                return (
                  <SwiperSlide key={i}>
                    <button
                      type="button"
                      className="videos-hero-slide-link dh-video-popup-trigger d-block text-decoration-none w-100 border-0 bg-transparent p-0 text-start"
                      aria-label={`Play hero video slide ${i + 1}`}
                      onClick={() => onVideoOpen(s)}
                    >
                      <div className="videos-hero-slide-frame video-play dh-relative videos-hero-slide">
                        <HeroSlideImage
                          uploadSrc={uploadSrc}
                          videoUrl={String(s.url ?? "")}
                          eager={i === 0}
                        />
                        <div className="videos-hero-slide__shade" aria-hidden />
                        <div className="play-btn text-center dh-absulate middle mob-width-auto videos-hero-play">
                          <Image
                            src="/frontend/img/play-world.png"
                            alt=""
                            width={100}
                            height={100}
                            className="img-fluid videos-hero-play__icon d-block mx-auto"
                            priority={i === 0}
                          />
                        </div>
                      </div>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {showNav ?
            <button
              type="button"
              className="videos-hero-outside-arrow videos-hero-outside-arrow--next"
              aria-label="Next slide"
              onClick={() => heroSwiper?.slideNext()}
            />
          : null}
        </div>
      </div>
    </div>
  );
}

export function VideosPageView({ slider, videos, movieTitleLookups = null, initialSearch = "" }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q) setSearch(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim();
    const base = q ? sortRowsForSearch(videos.filter((r) => rowMatchesQuery(r, q))) : videos;
    return base;
  }, [videos, search]);

  const grouped = useMemo(
    () => groupByMovieKey(filtered, movieTitleLookups),
    [filtered, movieTitleLookups]
  );
  const noMovieFound = search.trim().length > 0 && grouped.length === 0;

  const [popupItem, setPopupItem] = useState(null);

  function openClip(item) {
    const embedSrc = youtubeEmbedUrl(item?.url);
    if (embedSrc) {
      setPopupItem(item);
      return;
    }
    const watch = youtubeWatchUrl(item?.url) || String(item?.url ?? "").trim();
    if (/^https?:\/\//i.test(watch)) {
      window.open(watch, "_blank", "noopener,noreferrer");
    }
  }

  function closePopup() {
    setPopupItem(null);
  }

  useEffect(() => {
    if (!popupItem) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [popupItem]);

  const embedSrc = popupItem ? youtubeEmbedUrl(popupItem.url) : "";

  return (
    <section className="dharma-top-bg videos-page-legacy">
      <div className="container">
        <div className="videos-page-mar">
          <div className="text-center">
            <div className="head-title mt45">
              <h1 className="color-white f120 text-up font-hammersmith margin0">VIDEOS</h1>
            </div>
            {search.trim() ?
              <div className="search-rslt mt15">
                <h3 className="color-primary margin0">Displaying Result For &apos;{search}&apos;</h3>
              </div>
            : null}
            <VideosSearchBar id="videos-search-main" value={search} onChange={setSearch} />
          </div>

          {!search.trim() && slider.length > 0 ?
            <HeroSlider slides={slider} onVideoOpen={openClip} />
          : null}
        </div>

        {noMovieFound ?
          <div className="videos-no-movie-found mt25 text-center">
            <h3 className="color-white text-cap color-primary text-center">Sorry, No Movie Found</h3>
          </div>
        : grouped.length ?
          grouped.map((g) => (
            <MovieVideoBlock
              key={g.movieKey}
              movie={g.movie}
              movieKey={g.movieKey}
              items={g.items}
              totalForMovie={g.totalForMovie}
              onOpenVideo={openClip}
            />
          ))
        : !search.trim() ?
          <p className="text-center color-white mt-4 pt-3">
            No videos loaded — ensure Strapi is running and check STRAPI_URL / STRAPI_API_TOKEN.
          </p>
        : null}

      </div>

      {embedSrc ?
        <div
          className="dh-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Video player"
          onClick={closePopup}
        >
          <div className="dh-modal-frame" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="dh-modal-close" onClick={closePopup} aria-label="Close video">
              ×
            </button>
            <iframe
              key={youtubeVideoId(popupItem?.url)}
              title={String(popupItem?.title ?? popupItem?.name ?? "Video")}
              src={embedSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      : null}
    </section>
  );
}
