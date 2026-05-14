"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { resolveUploadUrl } from "@/lib/media";

/** Match legacy flexslider `item-width` / rough cap for performance. */
const MAX_RELATED = 36;

/**
 * Movie detail “Related Movies” — legacy `movie-inside.html`: centered row when few,
 * horizontal strip when many; mobile always scrolls horizontally.
 */
export function MovieRelatedMoviesStrip({ related }) {
  const items = useMemo(() => {
    if (!Array.isArray(related)) return [];
    return related.slice(0, MAX_RELATED);
  }, [related]);

  if (items.length === 0) return null;

  const renderCard = (item) => {
    const img =
      resolveUploadUrl(item.recentSmall) ||
      resolveUploadUrl(item.smallImage) ||
      resolveUploadUrl(item.upcomingSmall);

    const poster = img ? (
      <div className="img-pads related-m-card-pad">
        <div className="position-relative movies-past-thumb-inner w-100">
          <Image
            src={img}
            alt={item.name || "Dharma Productions"}
            fill
            className="object-fit-cover img-responsive w-100"
            sizes="(max-width: 575px) 45vw, 215px"
            loading="lazy"
            quality={78}
          />
        </div>
      </div>
    ) : (
      <div
        className="img-pads related-m-card-pad related-m-card-pad--empty"
        aria-hidden
      />
    );

    const slug =
      item.urlName != null && String(item.urlName).trim() !== "" ?
        String(item.urlName).trim()
      : "";

    // Link whenever we have a route slug. `status` is a list/detail gate in Strapi
    // (synopsis/background heuristics) and would hide links for many valid movie pages.
    if (slug) {
      return (
        <Link
          href={`/movie/${encodeURIComponent(slug)}`}
          className="text-decoration-none text-reset d-block related-m-card-link"
        >
          {poster}
        </Link>
      );
    }
    return <div className="related-m-card-link">{poster}</div>;
  };

  const useSwiperDesktop = items.length > 5;

  return (
    <div className="related-m">
      <div className="bg-screen mobile-row">
        <h1 className="related-m-title color-white font-hammersmith text-up line45 margin0 ml15 f55">
          Related Movies
        </h1>

        <div className="d-none d-md-block">
          {!useSwiperDesktop ? (
            <div className="related-m-static-row row-flex text-center justify-content-center mt20">
              {items.map((item) => (
                <div className="related-m-static-col" key={item._id}>
                  {renderCard(item)}
                </div>
              ))}
            </div>
          ) : (
            <div className="related-m-swiper-wrap mt20">
              <Swiper
                modules={[FreeMode]}
                freeMode
                slidesPerView="auto"
                spaceBetween={20}
                threshold={12}
                watchOverflow
                className="related-movies-swiper"
              >
                {items.map((item) => (
                  <SwiperSlide key={item._id} className="related-movies-slide">
                    {renderCard(item)}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>

        <div className="d-md-none">
          <div className="related-m-swiper-wrap mt20">
            <Swiper
              modules={[FreeMode]}
              freeMode
              slidesPerView="auto"
              spaceBetween={16}
              threshold={12}
              watchOverflow
              className="related-movies-swiper related-movies-swiper--mob"
            >
              {items.map((item) => (
                <SwiperSlide key={`mob-${item._id}`} className="related-movies-slide">
                  {renderCard(item)}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
}
