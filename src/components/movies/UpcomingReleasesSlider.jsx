"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { movieSlug } from "@/lib/moviesLayout";
import { resolveUploadUrl } from "@/lib/media";
import "swiper/css";
import "swiper/css/pagination";

function ordinalSuffix(day) {
  const j = day % 10;
  const k = day % 100;
  if (k >= 11 && k <= 13) return "th";
  if (j === 1) return "st";
  if (j === 2) return "nd";
  if (j === 3) return "rd";
  return "th";
}

/** e.g. "22nd January 2026" — matches legacy presentation */
function formatReleaseLine(d) {
  if (d === undefined || d === null || d === "") return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const day = dt.getDate();
  return `${day}${ordinalSuffix(day)} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function UpcomingMetaBar({ item }) {
  const release = formatReleaseLine(item.releaseDate);
  const director = item.director?.trim();
  const cast = item.mainCast?.trim();
  if (!release && !director && !cast) return null;
  return (
    <div className="movies-upcoming-meta px-3 py-2 px-md-4">
      <div className="movies-upcoming-meta-inner font-karla small text-dark">
        {release ?
          <>
            <span className="movies-upcoming-meta-label">Release Date: </span>
            <span className="color-primary fw-semibold">{release}</span>
          </>
        : null}
        {director ?
          <>
            {release ? <span className="movies-upcoming-meta-sep text-primary"> | </span> : null}
            <span className="movies-upcoming-meta-label">Director: </span>
            <span>{director}</span>
          </>
        : null}
        {cast ?
          <>
            {release || director ? <span className="movies-upcoming-meta-sep text-primary"> | </span> : null}
            <span className="movies-upcoming-meta-label">Main Cast: </span>
            <span>{cast}</span>
          </>
        : null}
      </div>
    </div>
  );
}

/** Card ~70–80% viewport width, arrows outside card — parity with reference UI */
export function UpcomingReleasesSlider({ items }) {
  const swiperRef = useRef(null);
  if (items.length === 0) return null;
  const loop = items.length > 1;

  return (
    <div className="movies-upcoming-outer common-class">
      <div className="movies-upcoming-row">
        <button
          type="button"
          className="movies-upcoming-arrow movies-upcoming-arrow--prev align-self-center"
          aria-label="Previous slide"
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <i className="fa-solid fa-chevron-left movies-upcoming-arrow-icon" aria-hidden />
        </button>
        <div className="movies-upcoming-card-column">
          <Swiper
            modules={[Autoplay, Pagination]}
            loop={loop}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={600}
            slidesPerView={1}
            spaceBetween={0}
            pagination={{
              clickable: true,
              dynamicBullets: items.length > 5,
            }}
            grabCursor
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="movies-upcoming-swiper-inner"
          >
            {items.map((item, index) => {
              const src = resolveUploadUrl(item.bigImage) || "/frontend/img/logo.png";
              const slideKey = `${movieSlug(item) || "up"}-${String(item._id ?? index)}`;
              const slideImg = (
                <div className="movies-upcoming-slide-img-holder position-relative w-100">
                  <Image
                    src={src}
                    alt={item.name || "Upcoming"}
                    fill
                    className="upcoming-slide-img rounded-0"
                    sizes="(max-width: 575px) 88vw, (max-width: 1200px) 78vw, 1120px"
                    priority={index === 0}
                    fetchPriority={index === 0 ? "high" : "low"}
                    quality={82}
                  />
                </div>
              );

              return (
                <SwiperSlide key={slideKey} className="movies-upcoming-slide">
                  <div className="video-box px-0">
                    <div className="video-slide-img movies-upcoming-frame">
                      {item.status ?
                        <Link href={`/movie/${encodeURIComponent(movieSlug(item))}`} className="d-block">
                          {slideImg}
                        </Link>
                      : slideImg}
                      <UpcomingMetaBar item={item} />
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
        <button
          type="button"
          className="movies-upcoming-arrow movies-upcoming-arrow--next align-self-center"
          aria-label="Next slide"
          onClick={() => swiperRef.current?.slideNext()}
        >
          <i className="fa-solid fa-chevron-right movies-upcoming-arrow-icon" aria-hidden />
        </button>
      </div>
    </div>
  );
}
