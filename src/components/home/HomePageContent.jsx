"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { resolveUploadUrl } from "@/lib/media";
import { movieSlug } from "@/lib/moviesLayout";
import { youtubeThumbnailUrl, youtubeWatchUrl } from "@/lib/youtube";
import { ContactDepartmentEmails } from "@/components/contact/ContactDepartmentEmails";
import { ContactMapWithAddressPanel } from "@/components/contact/ContactMapWithAddressPanel";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function slideHrefForHero(s) {
  const raw = String(s.url || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return youtubeWatchUrl(raw) || null;
}

/**
 * Hero slide — uses a native <picture> element so the browser only downloads
 * the image that matches the current viewport:
 *   • ≤575 px  → mobileImage (portrait  705 × 1087)
 *   • >575 px → image       (landscape 1600 × 713)
 * Slides are not linked (marketing hero only); arrows + autopilot still advance the carousel.
 */
function HeroSlideContent({ s, slideIndex }) {
  const desktopSrc = s.image || "";
  const mobileSrc = s.mobileImage || desktopSrc;

  return (
    <div className="dh-hero-slide-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <picture>
        {mobileSrc && mobileSrc !== desktopSrc ?
          <source media="(max-width: 575px)" srcSet={mobileSrc} />
        : null}
        {desktopSrc ?
          <img
            src={desktopSrc}
            alt={slideIndex === 0 ? "Dharma Productions" : ""}
            className="dh-hero-slide-img"
            width={1600}
            height={713}
            loading={slideIndex === 0 ? "eager" : "lazy"}
            fetchPriority={slideIndex === 0 ? "high" : "auto"}
            decoding={slideIndex === 0 ? "sync" : "async"}
          />
        : null}
      </picture>
    </div>
  );
}

function formatRelease(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function monthYearLabel(m) {
  const month = Number(m?.month);
  const year = Number(m?.year);
  if (Number.isFinite(month) && month >= 1 && month <= 12 && Number.isFinite(year)) {
    const mo = new Date(2000, month - 1, 1).toLocaleString("en", { month: "short" });
    return `(${mo} ${year})`;
  }
  if (Number.isFinite(year)) return `(${year})`;
  return "";
}

function ViewAllMoviesLink() {
  return (
    <div className="btn-view-more mt15 text-center">
      <Link href="/movies" className="btn-1 dh-view-all-btn font-hammersmith mx-auto">
        <svg aria-hidden="true" focusable="false" style={{ pointerEvents: "none" }}>
          <rect x="0" y="0" fill="none" width="100%" height="100%" />
        </svg>
        <span className="dh-view-all-label">VIEW ALL</span>
      </Link>
    </div>
  );
}

function ViewAllVideosLink() {
  return (
    <div className="btn-view-more mt15 text-center">
      <Link href="/videos" className="btn-1 dh-view-all-btn font-hammersmith mx-auto">
        <svg aria-hidden="true" focusable="false" style={{ pointerEvents: "none" }}>
          <rect x="0" y="0" fill="none" width="100%" height="100%" />
        </svg>
        <span className="dh-view-all-label">VIEW ALL</span>
      </Link>
    </div>
  );
}

function MovieThumbCard({ item, released }) {
  const slug = movieSlug(item);
  const src = released ?
      resolveUploadUrl(item.recentSmall || item.smallImage)
    : resolveUploadUrl(item.upcomingSmall || item.smallImage);
  const thumbSrc = src || "/frontend/img/logo.png";
  const imgEl = (
    <div className="position-relative w-100 dh-movie-thumb-frame overflow-hidden mx-auto rounded-0">
      <Image
        src={thumbSrc}
        alt={item.name || "Dharma Productions"}
        fill
        className="object-fit-cover"
        sizes="(max-width: 767px) 42vw, 200px"
        loading="lazy"
      />
    </div>
  );
  const caption = released ?
    (
      <h4 className="text-up color-grey">
        {(item.name || "").slice(0, 20)}
        <br />
        {monthYearLabel(item)}
      </h4>
    )
  : (
      <h4 className="text-up color-grey">
        {(item.name || "").slice(0, 20)}
        <br />
        {item.releaseDate ?
          <span>{formatRelease(item.releaseDate)}</span>
        : null}
      </h4>
    );

  const inner = (
    <>
      <div className="img-pads">{imgEl}</div>
      <div className="movie-names">{caption}</div>
    </>
  );

  if (item.status && slug) {
    return (
      <Link href={`/movie/${encodeURIComponent(slug)}`} className="text-decoration-none text-reset d-block">
        {inner}
      </Link>
    );
  }
  return <div className="d-block">{inner}</div>;
}

export function HomePageContent({
  heroSlides = [],
  upcomingMovies = [],
  recentMovies = [],
  videoRows = [],
  videoFeature = null,
  newsItems = [],
  newsShowMoreStories = false,
}) {
  const [tab, setTab] = useState("upcoming");
  const [subEmail, setSubEmail] = useState("");
  const [subMsg, setSubMsg] = useState("");
  const [subBusy, setSubBusy] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const heroSwiperRef = useRef(null);
  const newsSwiperRef = useRef(null);
  const moviesSectionRef = useRef(null);

  const scrollToMovies = () => {
    moviesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const slides = useMemo(
    () => (Array.isArray(heroSlides) && heroSlides.length ? heroSlides : []),
    [heroSlides],
  );

  const displayUpcoming = useMemo(() => (Array.isArray(upcomingMovies) ? upcomingMovies.slice(0, 10) : []), [upcomingMovies]);
  const displayRecent = useMemo(() => (Array.isArray(recentMovies) ? recentMovies.slice(0, 10) : []), [recentMovies]);

  const { feature, strip } = useMemo(() => {
    const sorted = Array.isArray(videoRows) ?
        [...videoRows].sort(
          (a, b) =>
            (Number(b.movieOrder) || 0) - (Number(a.movieOrder) || 0) ||
            (Number(b.order) || 0) - (Number(a.order) || 0),
        )
      : [];
    const hasSailsFeature = Boolean(videoFeature && (videoFeature.image || videoFeature.url));
    if (hasSailsFeature) {
      return { feature: videoFeature, strip: sorted.slice(0, 16) };
    }
    const f = sorted[0] ?? null;
    return { feature: f, strip: sorted.slice(1, 17) };
  }, [videoFeature, videoRows]);

  const featureThumb =
    feature ?
      (() => {
        const img = feature.image || feature.thumbnail;
        if (img) return resolveUploadUrl(String(img)) || String(img);
        return youtubeThumbnailUrl(feature.url) || "";
      })()
    : "";

  const newsHomeSlideCount =
    (Array.isArray(newsItems) ? newsItems.length : 0) + (newsShowMoreStories ? 1 : 0);

  return (
    <div className="dharma-home">
      <section className="home-hero">
        <div className="home-slider dh-relative width-auto">
          <div className="dh-hero-slider-wrap">
            <Swiper
              modules={[Autoplay, Pagination]}
              slidesPerView={1}
              loop={slides.length > 1}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              pagination={{ clickable: false }}
              onSwiper={(swiper) => { heroSwiperRef.current = swiper; }}
              className="dharma-home-hero-swiper"
            >
              {slides.map((s, i) => (
                <SwiperSlide key={`${s.order}-${i}`}>
                  <HeroSlideContent s={s} slideIndex={i} />
                </SwiperSlide>
              ))}
            </Swiper>
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  className="movies-upcoming-arrow dh-hero-slider-arrow dh-hero-slider-arrow--prev"
                  aria-label="Previous slide"
                  onClick={() => heroSwiperRef.current?.slidePrev()}
                >
                  <i className="fa-solid fa-chevron-left movies-upcoming-arrow-icon" aria-hidden />
                </button>
                <button
                  type="button"
                  className="movies-upcoming-arrow dh-hero-slider-arrow dh-hero-slider-arrow--next"
                  aria-label="Next slide"
                  onClick={() => heroSwiperRef.current?.slideNext()}
                >
                  <i className="fa-solid fa-chevron-right movies-upcoming-arrow-icon" aria-hidden />
                </button>
              </>
            )}
          </div>
          <div className="movie-tab text-center dh-absulate dh-list second">
            <ul className="padding0 margin0 up-tab list-unstyled d-flex justify-content-center flex-wrap mb-0">
              <li className={`mr2${tab === "upcoming" ? " active-tab" : ""}`}>
                <button
                  type="button"
                  className="border-0 bg-transparent p-0"
                  onClick={() => { setTab("upcoming"); scrollToMovies(); }}
                >
                  <span className="margin0 font-hammersmith d-none d-md-block h1">UPCOMING</span>
                  <span className="margin0 font-hammersmith h6 text-up d-md-none">UPCOMING</span>
                </button>
              </li>
              <li className={tab === "released" ? "active-tab" : ""}>
                <button type="button" className="border-0 bg-transparent p-0" onClick={() => { setTab("released"); scrollToMovies(); }}>
                  <span className="margin0 font-hammersmith d-none d-md-block h1">RELEASED</span>
                  <span className="margin0 font-hammersmith h6 text-up d-md-none">RELEASED</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section ref={moviesSectionRef}>
        <div className="container">
          <div className="tab-active">
            {tab === "upcoming" ?
              <div className="upcoming mobile-row">
                {displayUpcoming.length === 0 ?
                  <p className="text-center color-grey py-4 mb-0">No upcoming titles right now.</p>
                : null}
                <div className="row-flex text-center d-none d-md-flex flex-wrap justify-content-center">
                  {displayUpcoming.map((item) => (
                    <div key={movieSlug(item) || item._id} className="col-flex px-1 mb-3">
                      <MovieThumbCard item={item} released={false} />
                    </div>
                  ))}
                </div>
                <div className="d-md-none">
                  <Swiper slidesPerView={1.15} spaceBetween={14} className="px-1">
                    {displayUpcoming.map((item) => (
                      <SwiperSlide key={`mu-${movieSlug(item)}`} style={{ maxWidth: 240 }}>
                        <MovieThumbCard item={item} released={false} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                {displayUpcoming.length > 0 ? <ViewAllMoviesLink /> : null}
              </div>
            : null}
            {tab === "released" ?
              <div className="release mobile-row">
                {displayRecent.length === 0 ?
                  <p className="text-center color-grey py-4 mb-0">No recent releases to show.</p>
                : null}
                <div className="row-flex text-center d-none d-md-flex flex-wrap justify-content-center">
                  {displayRecent.map((item) => (
                    <div key={movieSlug(item) || item._id} className="col-flex px-1 mb-3">
                      <MovieThumbCard item={item} released />
                    </div>
                  ))}
                </div>
                <div className="d-md-none">
                  <Swiper slidesPerView={1.15} spaceBetween={14} className="px-1">
                    {displayRecent.map((item) => (
                      <SwiperSlide key={`mr-${movieSlug(item)}`} style={{ maxWidth: 240 }}>
                        <MovieThumbCard item={item} released />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                {displayRecent.length > 0 ? <ViewAllMoviesLink /> : null}
              </div>
            : null}
          </div>
        </div>
      </section>

      <section className="dh-relative">
        <div className="dharma-tv-bg dharma-home-tv">
          <div className="container">
            <div className="row justify-content-center">
              <div className="dharma-title text-md-end titles mt30 col-12 col-lg-10">
                <h1 className="margin0 color-primary font-hammersmith line45 home-videos-title">VIDEOS</h1>
              </div>
            </div>
            {feature ?
              <div className="row justify-content-center">
                <div className="col-12 col-lg-10">
                  <div className="dharma-home-tv-feature video-play text-shadow dh-relative">
                    <a
                      href={youtubeWatchUrl(feature.url) || slideHrefForHero(feature) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-block position-relative"
                    >
                      {featureThumb ?
                        <span className="d-block position-relative w-100 dh-home-feature-thumb">
                          <Image
                            src={featureThumb}
                            alt=""
                            fill
                            className="object-fit-cover img-responsive width100 rounded-0"
                            sizes="(max-width: 768px) 100vw, 1200px"
                            loading="lazy"
                          />
                        </span>
                      : null}
                      <span className="dharma-home-play-overlay dh-absulate">
                        <Image src="/frontend/img/play-world.png" alt="Play" width={120} height={120} className="img-fluid" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            : null}
          </div>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10">
                {strip.length > 0 ?
                  <div className="video-slider slider-nav mt30 min-tp-nm">
                    <Swiper
                      modules={[Navigation]}
                      slidesPerView={1.2}
                      spaceBetween={12}
                      navigation
                      breakpoints={{
                        576: { slidesPerView: 2, spaceBetween: 14 },
                        768: { slidesPerView: 3, spaceBetween: 16 },
                        1200: { slidesPerView: 4, spaceBetween: 16 },
                      }}
                      className="dharma-home-video-strip"
                    >
                      {strip.map((row, ri) => {
                        const rawUrl = String(row.url || "").trim();
                        const watch = /^https?:\/\//i.test(rawUrl) ? rawUrl : youtubeWatchUrl(rawUrl) || "";
                        const thumb =
                          resolveUploadUrl(row.thumbnail) || youtubeThumbnailUrl(row.url) || "";
                        const title = String(row.title || "").slice(0, 80);
                        const key = `${rawUrl}-${title}-${ri}`;
                        return (
                          <SwiperSlide key={key}>
                            <a href={watch || "#"} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              <div className="video-box">
                                <div className="video-slide-img">
                                  <div className="img-animate dh-relative">
                                    {thumb ?
                                      <span className="position-relative d-block dh-home-strip-thumb rounded-0">
                                        <Image
                                          src={thumb}
                                          alt=""
                                          fill
                                          className="object-fit-cover width100 rounded-0"
                                          sizes="(max-width: 576px) 45vw, (max-width: 1200px) 33vw, 360px"
                                          loading="lazy"
                                        />
                                      </span>
                                    : null}
                                  </div>
                                </div>
                                <div className="video-names mt10">
                                  <span className="color-white">{title}</span>
                                </div>
                              </div>
                            </a>
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                    <ViewAllVideosLink />
                  </div>
                : null}
              </div>
            </div>
          </div>

          {/* Subscribe card inside dark section — keeps black background flush behind the card */}
          <div className="container-fluid position-relative px-0 dharma-home-subscribe-wrap">
          <div className="subscribe dharma-home-subscribe">
            <div className="container">
              {/* Same centred `col-lg-10` width as Videos feature strip — aligns subscribe.png with hero film art */}
              <div className="row justify-content-center">
                <div className="col-12 col-lg-10">
                  <div className="row">
                    <div className="col-md-6 text-center col-sm-7">
                      <div className="display-inline up-img">
                        <Image
                          src="/frontend/img/subscribe.png"
                          alt=""
                          width={135}
                          height={117}
                          className="img-responsive"
                          sizes="135px"
                          loading="lazy"
                        />
                      </div>
                      <div className="sub-text display-inline mt20">
                        <h3 className="font-hammersmith color-primary text-up margin0">SUBSCribe NOW</h3>
                        <h3 className="font-hammersmith color-primary text-up margin0">for MORE UPDATES</h3>
                      </div>
                    </div>
                    <div className="col-md-6 col-sm-5">
                      <form
                        className="sub-input mt20 sub-text home-subscribe-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setSubMsg("");
                          const t = subEmail.trim();
                          if (!t) return;
                          setSubBusy(true);
                          try {
                            const r = await fetch("/api/subscribe", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: t }),
                            });
                            const j = await r.json().catch(() => ({}));
                            const data = j?.data;
                            if (data && typeof data === "object" && data.message === "already exist") {
                              setSubMsg("This email is already subscribed.");
                            } else if (j?.value !== false) {
                              setSubEmail("");
                              setSubMsg("");
                              setShowSubModal(true);
                            } else {
                              setSubMsg("Subscription could not be saved. Try again later.");
                            }
                          } catch {
                            setSubMsg("Network error. Try again later.");
                          } finally {
                            setSubBusy(false);
                          }
                        }}
                      >
                        <div className="input-group">
                          <input
                            type="email"
                            className="form-control"
                            placeholder="Enter your email-id"
                            name="email"
                            autoComplete="email"
                            value={subEmail}
                            onChange={(e) => setSubEmail(e.target.value)}
                            disabled={subBusy}
                          />
                          <span className="input-group-text go-btn border-0 bg-transparent p-0">
                            <button
                              className="color-primary font-hammersmith border-0 bg-transparent"
                              type="submit"
                              disabled={subBusy}
                            >
                              GO
                            </button>
                          </span>
                        </div>
                        {subMsg ?
                          <p className="small mt-2 mb-0 color-primary" role="status">
                            {subMsg}
                          </p>
                        : null}
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>{/* closes dharma-home-subscribe-wrap */}
        </div>{/* closes dharma-tv-bg dharma-home-tv */}
      </section>

      {newsItems && newsItems.length > 0 ?
        <section className="bg-sun home-news-sun">
          <div className="news">
            <div className="title">
              <h1 className="font-hammersmith color-white margin0 line45 home-news-title text-up">NEWS</h1>
            </div>
            <div className="news-slider slider-right mt30">
              <Swiper
                spaceBetween={16}
                slidesOffsetBefore={0}
                slidesOffsetAfter={40}
                slidesPerView={1.2}
                onSwiper={(swiper) => { newsSwiperRef.current = swiper; }}
                breakpoints={{
                  576: { slidesPerView: 2, spaceBetween: 16, slidesOffsetAfter: 48 },
                  768: { slidesPerView: 3, spaceBetween: 20, slidesOffsetAfter: 56 },
                  1200: { slidesPerView: "auto", spaceBetween: 60, slidesOffsetAfter: 64 },
                }}
                className="home-news-swiper"
              >
                {newsItems.map((n) => (
                  <SwiperSlide key={n.id}>
                    <Link href={`/news-events/${encodeURIComponent(n.slug || n.id)}`} className="text-decoration-none text-reset">
                      <div className="video-box">
                        <div className="video-slide-img">
                          <div className="img-animate">
                            {n.image ?
                              <span className="position-relative d-block dh-home-news-thumb">
                                <Image
                                  src={n.image}
                                  alt=""
                                  fill
                                  className="object-fit-cover rounded-0 img-responsive"
                                  sizes="(max-width: 576px) 90vw, (max-width: 768px) 45vw, (max-width: 1200px) 30vw, 300px"
                                  loading="lazy"
                                />
                              </span>
                            : null}
                          </div>
                        </div>
                        <div className="video-name mt20 h40">
                          <h4 className="color-white margin0">{n.title.slice(0, 55)}</h4>
                        </div>
                        <div className="video-date">
                          {n.date ? <span className="color-black f12">{n.date}</span> : null}
                        </div>
                        <div className="video-desc"></div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
                {newsShowMoreStories ?
                  <SwiperSlide key="__more-stories">
                    <Link href="/news-events" className="dh-home-news-more-card text-decoration-none text-reset d-block">
                      <div className="img-animate">
                        <span className="position-relative d-block dh-home-news-thumb">
                          <Image
                            src="/frontend/img/more.jpg"
                            alt="More stories"
                            fill
                            className="object-fit-cover rounded-0 img-responsive"
                            sizes="(max-width: 576px) 90vw, (max-width: 768px) 45vw, (max-width: 1200px) 30vw, 300px"
                            loading="lazy"
                          />
                        </span>
                      </div>
                    </Link>
                  </SwiperSlide>
                : null}
              </Swiper>
              {newsHomeSlideCount > 1 ?
                <>
                  <button
                    type="button"
                    className="movies-upcoming-arrow home-news-slider-arrow home-news-slider-arrow--prev"
                    aria-label="Previous news"
                    onClick={() => newsSwiperRef.current?.slidePrev()}
                  >
                    <Image
                      src="/frontend/img/news-right.png"
                      alt=""
                      width={40}
                      height={47}
                      className="home-news-slider-arrow-img"
                    />
                  </button>
                  <button
                    type="button"
                    className="movies-upcoming-arrow home-news-slider-arrow home-news-slider-arrow--next"
                    aria-label="Next news"
                    onClick={() => newsSwiperRef.current?.slideNext()}
                  >
                    <Image
                      src="/frontend/img/news-left.png"
                      alt=""
                      width={40}
                      height={47}
                      className="home-news-slider-arrow-img"
                    />
                  </button>
                </>
              : null}
            </div>
          </div>
        </section>
      : null}

      {/* Dharma World — legacy home.html: news-bg, two-row grid, corner PNGs, ENTER */}
      <section className="d-none d-md-block home-dharma-world-desktop">
        <div className="dhrarma-world dh-relative">
          <span className="d-block w-100 home-dharma-world-hero">
            <Image
              src="/frontend/img/news-bg.jpg"
              alt=""
              width={1920}
              height={720}
              className="img-fluid w-100 h-auto d-block"
              sizes="100vw"
              loading="lazy"
            />
          </span>
          <div className="container dh-absulate middle">
            <div className="row">
              <div className="col-12 offset-md-1 col-md-10 text-center">
                <div className="dharma-world-text text-center">
                  <div className="text-center">
                    <Image
                      src="/frontend/img/dharma-img.png"
                      alt="Dharma Productions"
                      width={529}
                      height={171}
                      className="img-fluid margin-auto d-block home-dharma-world-logo"
                      sizes="(max-width: 768px) 92vw, (max-width: 1200px) 600px, 630px"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row home-dharma-world-copy-row">
              <div className="col-12 offset-md-2 col-md-8">
                <div className="pad-inner text-center">
                  <p className="color-white margin0">For those whose dharma is Dharma, welcome home.</p>
                  <p className="color-white mb-0">
                    Entertainment | Interaction | and much more; we bring to you the best of the Dharma Family.
                  </p>
                  <div className="btn-view-enter mt20 text-center mob-marg0">
                    <Link
                      href="/social"
                      className="btn-1 font-hammersmith btn border-0 color-white text-center text-decoration-none home-dharma-world-enter d-inline-block"
                    >
                      <svg aria-hidden="true" focusable="false" style={{ pointerEvents: "none" }}>
                        <rect x="0" y="0" fill="none" width="100%" height="100%" />
                      </svg>
                      <span className="home-dharma-world-enter-label">ENTER</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="top-right dh-absulate home-dharma-world-corner home-dharma-world-corner--tr">
            <Image
              src="/frontend/img/top-right.png"
              alt=""
              width={280}
              height={400}
              className="d-block home-dharma-world-corner-img"
              sizes="280px"
              loading="lazy"
            />
          </div>
          <div className="bottom-left dh-absulate home-dharma-world-corner home-dharma-world-corner--bl">
            <Image
              src="/frontend/img/bottom-left.png"
              alt=""
              width={303}
              height={459}
              className="d-block home-dharma-world-corner-img"
              sizes="303px"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="d-md-none dh-home-dharma-world-xs">
        <div className="dhrarma-world dh-relative bg-inner">
          <div className="container">
            <div className="row">
              <div className="col-12 offset-md-1 col-md-10 text-center">
                <div className="dharma-world-text text-center">
                  <div className="text-center">
                    <Image
                      src="/frontend/img/dharma-img.png"
                      alt="Dharma Productions"
                      width={529}
                      height={171}
                      className="img-fluid margin-auto d-block home-dharma-world-logo"
                      sizes="(max-width: 576px) 92vw, 630px"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row home-dharma-world-copy-row">
              <div className="col-12 offset-md-2 col-md-8">
                <div className="pad-inner text-center">
                  <p className="color-white margin0">For those whose dharma is Dharma, welcome home.</p>
                  <p className="color-white mb-0">
                    Entertainment | Interaction | and much more; we bring to you the best of the Dharma Family.
                  </p>
                  <div className="btn-view-enter mt20 text-center mob-marg0">
                    <Link
                      href="/social"
                      className="btn-1 font-hammersmith btn border-0 color-white text-center text-decoration-none home-dharma-world-enter d-inline-block"
                    >
                      <svg aria-hidden="true" focusable="false" style={{ pointerEvents: "none" }}>
                        <rect x="0" y="0" fill="none" width="100%" height="100%" />
                      </svg>
                      <span className="home-dharma-world-enter-label">ENTER</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dharma-title-bg">
        {/* legacy `home.html`: `.col-md-offset-2` + `.col-md-6` */}
        <div className="container">
          <div className="row">
            <div className="col-md-6 offset-md-2">
              <div className="title">
                <h1 className="color-primary font-hammersmith f90 line45">LET&rsquo;S TALK</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Same interactive map + address overlay + dept tiles as `/contact-us` */}
        <div className="contact-page">
          <ContactMapWithAddressPanel />
        </div>
      </section>

      <section className="home-contact">
        <ContactDepartmentEmails />
      </section>

      {/* Subscribe success modal — matches legacy subscribe.html popup */}
      {showSubModal && (
        <div
          className="dh-subscribe-modal-overlay"
          onClick={() => setShowSubModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Subscription confirmed"
        >
          <div
            className="dh-subscribe-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="closure"
              aria-label="Close"
              onClick={() => setShowSubModal(false)}
            >
              <i className="fa fa-times" aria-hidden="true" />
            </button>
            <div className="text-center h3-main">
              <h3 className="text-up color-primary margin0">THANK YOU FOR SUBSCRIBING!</h3>
              <h3 className="text-up color-primary margin0">WE PROMISE YOUR INBOX WON&apos;T BE DISAPPOINTED.</h3>
              <div className="mt15 some-c">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="btn-1 dh-view-all-btn font-hammersmith color-primary mx-auto mt-3"
                >
                  <svg aria-hidden="true" focusable="false" style={{ pointerEvents: "none" }}>
                    <rect x="0" y="0" fill="none" width="100%" height="100%" />
                  </svg>
                  <span className="dh-view-all-label">CONTINUE TO SITE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
