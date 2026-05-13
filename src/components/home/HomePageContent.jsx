"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { resolveUploadUrl } from "@/lib/media";
import { movieSlug } from "@/lib/moviesLayout";
import { youtubeThumbnailUrl, youtubeWatchUrl } from "@/lib/youtube";
import { CONTACT_GOOGLE_MAPS_URL } from "@/lib/contactOfficeMap";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function slideHrefForHero(s) {
  const raw = String(s.url || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return youtubeWatchUrl(raw) || null;
}

function HeroSlideContent({ s, imageSrc, slideIndex }) {
  const slug = s.movieSlug ? String(s.movieSlug).trim() : "";
  const external = slideHrefForHero(s);
  const heroInner = (
    <div className="position-relative w-100 dh-hero-slide-frame overflow-hidden rounded-0">
      <Image
        src={imageSrc}
        alt={slideIndex === 0 ? "Dharma Productions" : ""}
        fill
        className="object-fit-cover"
        sizes="100vw"
        priority={slideIndex === 0}
        fetchPriority={slideIndex === 0 ? "high" : "low"}
        quality={slideIndex === 0 ? 85 : 70}
      />
    </div>
  );
  if (slug) {
    return (
      <Link href={`/movie/${encodeURIComponent(slug)}`} className="d-block">
        {heroInner}
      </Link>
    );
  }
  if (external) {
    return (
      <a href={external} target="_blank" rel="noopener noreferrer" className="d-block">
        {heroInner}
      </a>
    );
  }
  return heroInner;
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
    <div className="btn-view-more mt15">
      <Link href="/movies" className="btn-1 font-hammersmith btn color-primary float-end mobile-center text-decoration-none">
        <svg aria-hidden="true" focusable="false">
          <rect x="0" y="0" fill="none" width="100%" height="100%" />
        </svg>
        VIEW ALL
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
}) {
  const [tab, setTab] = useState("upcoming");
  const [subEmail, setSubEmail] = useState("");
  const [subMsg, setSubMsg] = useState("");
  const [subBusy, setSubBusy] = useState(false);

  const slides = useMemo(() => {
    if (Array.isArray(heroSlides) && heroSlides.length) return heroSlides;
    return [{ url: "", image: "", order: 0 }];
  }, [heroSlides]);

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

  return (
    <div className="dharma-home">
      <section className="home-hero">
        <div className="home-slider dh-relative width-auto">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            slidesPerView={1}
            loop={slides.length > 1}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="dharma-home-hero-swiper"
          >
            {slides.map((s, i) => {
              const imgSrc =
                resolveUploadUrl(s.image) || s.image || youtubeThumbnailUrl(s.url) || "/frontend/img/logo.png";
              return (
                <SwiperSlide key={`${s.order}-${i}`}>
                  <HeroSlideContent s={s} imageSrc={imgSrc} slideIndex={i} />
                </SwiperSlide>
              );
            })}
          </Swiper>
          <div className="movie-tab text-center dh-absulate dh-list second">
            <ul className="padding0 margin0 up-tab list-unstyled d-flex justify-content-center flex-wrap mb-0">
              <li className={`mr2${tab === "upcoming" ? " active-tab" : ""}`}>
                <button
                  type="button"
                  className="border-0 bg-transparent p-0"
                  onClick={() => {
                    setTab("upcoming");
                  }}
                >
                  <span className="margin0 font-hammersmith d-none d-md-block h1">UPCOMING</span>
                  <span className="margin0 font-hammersmith h6 text-up d-md-none">UPCOMING</span>
                </button>
              </li>
              <li className={tab === "released" ? "active-tab" : ""}>
                <button type="button" className="border-0 bg-transparent p-0" onClick={() => setTab("released")}>
                  <span className="margin0 font-hammersmith d-none d-md-block h1">RELEASED</span>
                  <span className="margin0 font-hammersmith h6 text-up d-md-none">RELEASED</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
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
        <div className="dharma-tv-bg dharma-home-tv pb-short">
          <div className="container">
            <div className="row">
              <div className="dharma-title text-md-end titles mt30 col-12">
                <h1 className="margin0 color-primary font-hammersmith line45 home-videos-title">VIDEOS</h1>
              </div>
            </div>
            {feature ?
              <div className="row">
                <div className="col-12">
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
            <div className="row">
              <div className="col-12">
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
                    <div className="text-center btn-view-all mt40">
                      <Link href="/videos" className="btn-1 font-hammersmith btn color-primary text-decoration-none">
                        <svg aria-hidden="true" focusable="false">
                          <rect x="0" y="0" fill="none" width="100%" height="100%" />
                        </svg>
                        VIEW ALL
                      </Link>
                    </div>
                  </div>
                : null}
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid position-relative px-0 dharma-home-subscribe-wrap">
          <div className="subscribe dharma-home-subscribe">
            <div className="container">
              <div className="row align-items-center gy-3">
                <div className="col-md-6 text-center col-sm-7">
                  <div className="display-inline up-img dh-home-subscribe-illus">
                    <Image
                      src="/frontend/img/subscribe.png"
                      alt=""
                      width={360}
                      height={140}
                      className="img-fluid"
                      sizes="360px"
                      loading="lazy"
                    />
                  </div>
                  <div className="sub-text display-inline mt20 text-start text-sm-center">
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
                          setSubMsg("Thank you for subscribing.");
                          setSubEmail("");
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
                      <button
                        className="go-btn color-primary font-hammersmith px-3 border-0 bg-transparent"
                        type="submit"
                        disabled={subBusy}
                      >
                        GO
                      </button>
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
      </section>

      {newsItems && newsItems.length > 0 ?
        <section className="bg-sun home-news-sun">
          <div className="news">
            <div className="title px-4 pt-4 pb-2">
              <h1 className="font-hammersmith color-white margin0 home-news-title text-up">NEWS</h1>
            </div>
            <div className="px-3 pb-5">
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1.15}
                navigation
                breakpoints={{
                  576: { slidesPerView: 1.5, spaceBetween: 24 },
                  768: { slidesPerView: 2.2, spaceBetween: 28 },
                  1200: { slidesPerView: 3.2, spaceBetween: 40 },
                }}
                className="home-news-swiper px-1"
              >
                {newsItems.map((n) => (
                  <SwiperSlide key={n.id}>
                    <Link href={`/news-events/${encodeURIComponent(n.slug || n.id)}`} className="text-decoration-none text-reset">
                      <div className="video-box">
                        <div className="video-slide-img">
                          <div className="img-animate">
                            {n.image ?
                              <span className="position-relative d-block dh-home-strip-thumb dh-home-news-thumb">
                                <Image
                                  src={n.image}
                                  alt=""
                                  fill
                                  className="object-fit-cover rounded-0 img-responsive"
                                  sizes="(max-width: 576px) 90vw, (max-width: 1200px) 42vw, 420px"
                                  loading="lazy"
                                />
                              </span>
                            : null}
                          </div>
                        </div>
                        <div className="video-name mt20 h40">
                          <h4 className="color-white margin0 small">{n.title.slice(0, 55)}</h4>
                        </div>
                        {n.date ?
                          <div className="video-date">
                            <span className="color-black f12">{n.date}</span>
                          </div>
                        : null}
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </section>
      : null}

      <section className="dharma-title-bg home-map-section">
        <div className="container">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="title">
                <h1 className="color-primary font-hammersmith f90 line45">LET&apos;S TALK</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="maps dh-relative">
          <div className="contact-page__map-root">
            <iframe
              className="contact-page__map-canvas contact-page__map-iframe"
              src="https://maps.google.com/maps?q=19.133687,72.836493&z=17&output=embed"
              title="Dharma Productions office location"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="contact-page__map-iframe-open">
              <a
                href={CONTACT_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-page__map-iframe-link"
              >
                Open in Google Maps ↗
              </a>
            </div>
          </div>

          <div className="dh-absulate add-show">
            <h4 className="margin0 font-karla">Dharma Productions Pvt. Ltd.</h4>
            <div className="mt15 font-karla">
              <p className="margin0">201 &amp; 202, 2nd Floor, Supreme Chambers,</p>
              <p className="margin0">Off Veera Desai Road, 17/18 Shah Industrial Estate,</p>
              <p className="margin0">Andheri (W), Mumbai- 400053, India</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-contact">
        <div className="container">
          <div className="padd-all-side">
            <div className="row g-4">
              {[
                { key: "info", title: "INFO", src: "/frontend/img/info.png", w: 25, h: 25, email: "info@dharma-production.com", label: "For info related queries email us on" },
                { key: "creative", title: "CREATIVE", src: "/frontend/img/creativity.png", w: 30, h: 33, email: "creative@dharma-production.com", label: "For creative related queries email us on" },
                { key: "marketing", title: "MARKETING", src: "/frontend/img/marketing.png", w: 25, h: 29, email: "marketing@dharma-production.com", label: "For marketing related queries email us on" },
              ].map((b) => (
                <div key={b.key} className="col-md-4 col-sm-12">
                  <div className="contact-info text-center">
                    <div className="info-icon display-inline">
                      <Image src={b.src} alt="" width={b.w} height={b.h} />
                    </div>
                    <div className="info-text display-inline">
                      <h2 className="color-primary font-karla font-bold">{b.title}</h2>
                    </div>
                    <div className="descp">
                      <p>{b.label}<br /><a href={`mailto:${b.email}`}>{b.email}</a></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row mt20 g-4 justify-content-center">
              <div className="d-none d-md-block col-md-2" aria-hidden />
              {[
                { key: "syndication", title: "SYNDICATION", src: "/frontend/img/syndication.png", w: 28, h: 28, email: "syndication@dharma-production.com", label: "For syndication related queries email us on" },
                { key: "legal", title: "LEGAL", src: "/frontend/img/legal.png", w: 27, h: 33, email: "legal@dharma-production.com", label: "For legal related queries contact us on" },
              ].map((b) => (
                <div key={b.key} className="col-12 col-md-4">
                  <div className="contact-info text-center">
                    <div className="info-icon display-inline">
                      <Image src={b.src} alt="" width={b.w} height={b.h} />
                    </div>
                    <div className="info-text display-inline">
                      <h2 className="color-primary font-karla font-bold">{b.title}</h2>
                    </div>
                    <div className="descp">
                      <p>{b.label}<br /><a href={`mailto:${b.email}`}>{b.email}</a></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="d-none d-md-block">
        <div className="dhrarma-world dh-relative">
          <Image
            src="/frontend/img/news-bg.jpg"
            alt=""
            width={1920}
            height={720}
            className="img-fluid w-100 h-auto"
            sizes="100vw"
            loading="lazy"
          />
          <div className="container dh-absulate middle">
            <div className="row justify-content-center">
              <div className="col-lg-10 text-center">
                <div className="dharma-world-text">
                  <Image
                    src="/frontend/img/dharma-img.png"
                    alt="Dharma Productions"
                    width={520}
                    height={180}
                    className="img-fluid margin-auto d-block mx-auto"
                    sizes="(max-width: 1200px) 80vw, 520px"
                    loading="lazy"
                  />
                </div>
                <div className="pad-inner text-center mt-3">
                  <p className="color-white margin0">For those whose dharma is Dharma, welcome home.</p>
                  <p className="color-white mb-0">
                    Entertainment | Interaction | and much more; we bring to you the best of the Dharma Family.
                  </p>
                  <div className="btn-view-enter mt20 text-center mob-marg0">
                    <Link href="/social" className="btn-1 font-hammersmith btn color-primary text-center text-decoration-none">
                      <svg aria-hidden="true" focusable="false">
                        <rect x="0" y="0" fill="none" width="100%" height="100%" />
                      </svg>
                      ENTER
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="top-right dh-absulate d-none d-lg-block">
            <Image src="/frontend/img/top-right.png" alt="" width={280} height={280} className="img-fluid" loading="lazy" />
          </div>
          <div className="bottom-left dh-absulate d-none d-lg-block">
            <Image src="/frontend/img/bottom-left.png" alt="" width={280} height={280} className="img-fluid" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="d-md-none bg-dark text-center py-5">
        <div className="container px-3">
          <Image
            src="/frontend/img/dharma-img.png"
            alt=""
            width={440}
            height={152}
            className="img-fluid mx-auto mb-3"
            style={{ maxWidth: 220, height: "auto" }}
            sizes="220px"
            loading="lazy"
          />
          <p className="color-white mb-2">For those whose dharma is Dharma, welcome home.</p>
          <Link href="/social" className="btn-1 font-hammersmith btn color-primary text-decoration-none">
            <svg aria-hidden="true" focusable="false">
              <rect x="0" y="0" fill="none" width="100%" height="100%" />
            </svg>
            ENTER
          </Link>
        </div>
      </section>
    </div>
  );
}
