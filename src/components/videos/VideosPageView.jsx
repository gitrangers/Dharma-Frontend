"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { VideosSearchBar } from "@/components/videos/VideosSearchBar";
import { resolveMovieUrlSlug } from "@/lib/movieModel";
import { resolveUploadUrl } from "@/lib/media";
import {
  youtubeThumbnailUrl,
  youtubeThumbnailUrlMax,
  youtubeVideoId,
  youtubeWatchUrl,
} from "@/lib/youtube";
import { resolveMovieTitleFromTvRow } from "@/lib/videosTitles";

import "swiper/css";
import "swiper/css/navigation";

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
    const first = g.items[0];
    const movie = resolveMovieTitleFromTvRow(first, movieTitleLookups ?? null);
    return { movie, movieKey: g.movieKey, items: g.items };
  });
}

function VideoTile({ item }) {
  const watch = youtubeWatchUrl(item.url);
  const thumb =
    resolveUploadUrl(item.thumbnail) || youtubeThumbnailUrl(item.url) || "";
  const title = shorten(String(item.title ?? ""), 60);

  return (
    <div className="video-box">
      <div className="video-slide-img em-box">
        <a
          href={watch || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="d-block text-decoration-none"
        >
          <div className="img-animated">
            <div className="img-inside-box em-box hover-sec">
              {thumb ?
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="img-responsive width100" />
              : null}
            </div>
          </div>
          <div className="video-names mt10">
            <span className="color-white text-cap">{title}</span>
          </div>
        </a>
      </div>
    </div>
  );
}

function VideoRowSwiper({ items }) {
  return (
    <div className="videos-tv-swiper-nav min-tp-nm">
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        loop={items.length > 3}
        autoplay={{
          delay: 4200,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
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
            <VideoTile item={item} />
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
      className="videos-hero-slide__img img-responsive width100 flexslider-slides-img"
      sizes="(max-width: 575px) 88vw, 78vw"
      loading={eager ? "eager" : "lazy"}
      {...(eager ? { fetchPriority: "high" } : {})}
      decoding="async"
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

function MovieVideoBlock({ movie, movieKey, items }) {
  const showSlider = items.length > 4;

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
          <VideoRowSwiper items={items} />
        : <div className="row g-3">
            {items.map((item, idx) => (
              <div key={`${movie}-${idx}`} className="col-6 col-md-3">
                <VideoTile item={item} />
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

function HeroSlider({ slides }) {
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
                const watch = youtubeWatchUrl(s.url);
                return (
                  <SwiperSlide key={i}>
                    <a
                      href={watch || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="videos-hero-slide-link d-block text-decoration-none"
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
                    </a>
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
            <HeroSlider slides={slider} />
          : null}
        </div>

        {noMovieFound ?
          <div className="videos-no-movie-found mt25 text-center">
            <h3 className="color-white text-cap color-primary text-center">Sorry, No Movie Found</h3>
          </div>
        : grouped.length ?
          grouped.map((g) => (
            <MovieVideoBlock key={g.movieKey} movie={g.movie} movieKey={g.movieKey} items={g.items} />
          ))
        : !search.trim() ?
          <p className="text-center color-white mt-4 pt-3">
            No videos loaded — ensure Strapi is running and check STRAPI_URL / STRAPI_API_TOKEN.
          </p>
        : null}

      </div>
    </section>
  );
}
