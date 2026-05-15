"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import { MovieSearchCombobox } from "@/components/movies/MovieSearchCombobox";
import { UpcomingReleasesSlider } from "@/components/movies/UpcomingReleasesSlider";
import { resolveUploadUrl } from "@/lib/media";
import { buildMovieList, chunkBy, movieSlug } from "@/lib/moviesLayout";

/** Same width band as four-up Past grid in `_dharma.scss` (`768px`–`1366.98px`). */
const PAST_GRID_FOUR_UP_MQ = "(min-width: 768px) and (max-width: 1366.98px)";

function usePastReleasesInitialDisplayCount() {
  /** SSR + first paint: 10 matches server; `useLayoutEffect` corrects to 8 on iPad/tablet before paint. */
  const [count, setCount] = useState(10);
  useLayoutEffect(() => {
    const mq = window.matchMedia(PAST_GRID_FOUR_UP_MQ);
    const sync = () => setCount(mq.matches ? 8 : 10);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return count;
}

function RecentReleaseCard({ data }) {
  const src = resolveUploadUrl(data.mediumImage) || "/frontend/img/logo.png";
  const card = (
    <div className="video-box mb20 common-class">
      <div className="video-slide-img img-pads">
        <div className="position-relative w-100 movies-recent-medium-inner">
          <Image
            src={src}
            alt="Dharma Productions"
            fill
            className="object-fit-cover img-responsive rounded-0"
            sizes="(max-width: 768px) 100vw, 560px"
            loading="lazy"
            quality={80}
          />
        </div>
      </div>
      <div className="video-name font-karla text-up">
        <span>
          {(data.name || "").slice(0, 60)}
          {data.year ? ` (${data.year})` : ""}
        </span>
      </div>
    </div>
  );
  return (
    <div className="col-md-6 col-sm-6 col-12">
      {data.status ?
        <Link href={`/movie/${encodeURIComponent(movieSlug(data))}`} className="text-decoration-none text-reset">
          {card}
        </Link>
      : card}
    </div>
  );
}

function PastReleaseCard({ item, mobile = false }) {
  const src = resolveUploadUrl(item.smallImage) || "/frontend/img/logo.png";
  const thumb = (
    <div className="img-pads">
      <div className="position-relative w-100 movies-past-thumb-inner">
        <Image
          src={src}
          alt={mobile ? "" : "Dharma Productions"}
          fill
          className="object-fit-cover img-responsive"
          sizes="(max-width: 767px) 207px, 19vw"
          loading="lazy"
          quality={78}
        />
      </div>
    </div>
  );
  const names = (
    <div className="movie-names">
      <h4 className={`text-up color-grey${mobile ? " small" : ""}`}>
        {(item.name || "").slice(0, 20)}
        <br />({item.year})
      </h4>
    </div>
  );
  const inner = (
    <>
      {thumb}
      {names}
    </>
  );
  if (mobile) {
    return item.status ?
        <Link href={`/movie/${encodeURIComponent(movieSlug(item))}`} className="text-decoration-none">
          {inner}
        </Link>
      : inner;
  }
  return item.status ?
      <Link href={`/movie/${encodeURIComponent(movieSlug(item))}`} className="text-decoration-none">
        {inner}
      </Link>
    : inner;
}

export function MoviesPageView({ initialDetails, searchNames, initialSearchQuery = "" }) {
  const router = useRouter();
  const [viewAll, setViewAll] = useState(false);
  const [searchPick, setSearchPick] = useState(() => initialSearchQuery || "");

  useEffect(() => {
    setSearchPick(initialSearchQuery || "");
  }, [initialSearchQuery]);

  const layout = useMemo(() => buildMovieList(initialDetails), [initialDetails]);
  const pastInitialCount = usePastReleasesInitialDisplayCount();
  const pastDisplayed = useMemo(
    () => (layout.pastSorted ?? []).slice(0, pastInitialCount),
    [layout.pastSorted, pastInitialCount]
  );
  const pastRest = useMemo(
    () => (layout.pastSorted ?? []).slice(pastInitialCount),
    [layout.pastSorted, pastInitialCount]
  );
  const pastChunks = useMemo(() => chunkBy(pastDisplayed, 5), [pastDisplayed]);
  const pastMoreChunks = useMemo(() => chunkBy(pastRest, 5), [pastRest]);

  const goMovie = (m) => {
    const slug = movieSlug(m);
    if (!slug || !m?.status) return;
    router.push(`/movie/${encodeURIComponent(slug)}`);
  };

  return (
    <>
      <div className="dharma-movies-bg">
        <section className="movies-page-hero">
          <div className="container">
            <div className="row">
              <div className="text-center">
                <div className="head-title movies-hero-head">
                  <h1 className="movies-hero-title-accent text-up font-hammersmith movies-head-xl mb-3">Movies</h1>
                </div>
                {searchPick ?
                  <div className="search-rslt mt-3">
                    <span className="movies-hero-title-accent">
                      Displaying Result For &apos;{searchPick}&apos;
                    </span>
                  </div>
                : null}
                <div className="search-movie dh-relative search-movie-mar mx-auto movies-hero-search-wrap">
                  <MovieSearchCombobox
                    movies={searchNames}
                    initialInputValue={initialSearchQuery}
                    parentSearchBanner={searchPick}
                    onClearBanner={() => {
                      setSearchPick("");
                      setViewAll(false);
                    }}
                    onSelect={(m) => {
                      setSearchPick(m.name || "");
                      goMovie(m);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {layout.upcoming.length > 0 ?
          <section className="dharma-top-pad slider-nav">
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <div className="upcoming-movie mt-4 common-class movies-upcoming-stack">
                    <div className="movies-upcoming-row movies-upcoming-row--title">
                      <div className="movies-upcoming-arrow movies-upcoming-arrow--placeholder" aria-hidden />
                      <div className="movies-upcoming-card-column">
                        <h1 className="ml15 mb0 color-primary font-hammersmith line30 f55 text-up">Upcoming Releases</h1>
                      </div>
                      <div className="movies-upcoming-arrow movies-upcoming-arrow--placeholder" aria-hidden />
                    </div>
                    <UpcomingReleasesSlider items={layout.upcoming} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        : null}
      </div>

      {layout.recentSlides.length > 0 ?
        <section className="dharma-movies-bg2">
          <div className="orange-bg">
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <div className="recent-movie">
                    <div className="title">
                      <h1 className="ml15 mb0 color-primary font-hammersmith line30 f55 text-up">Recent Releases</h1>
                    </div>
                    <div className="upcoming-slider slider-right">
                      {layout.recentSlides.map((slide, si) => (
                        <div key={`slide-${si}`} className="div-none-slide">
                          {slide.map((datasRow, ri) => (
                            <div key={`row-${si}-${ri}`} className="row">
                              {datasRow.map((data) => (
                                <RecentReleaseCard
                                  key={`${movieSlug(data) || ""}-${String(data._id ?? data.year ?? "")}`}
                                  data={data}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      : null}

      {(layout.pastSorted ?? []).length > 0 ?
        <section className="dharma-movies-bg3">
          <div className="orange-bg recent-movie pb-5">
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <div className="upcoming-movie">
                    <div className="title">
                      <h1 className="ml15 mb0 color-primary font-hammersmith line30 f55 text-up">Past Releases</h1>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mobile-row hidden-xs d-none d-md-block movies-past-grid-row">
                <div className="row-flex text-center flex-wrap justify-content-center">
                  {pastChunks.flatMap((videos, ci) =>
                    videos.map((item, ri) => (
                      <div
                        key={`pch-${ci}-${movieSlug(item) ?? "past"}-${String(item._id ?? item.year ?? ri)}`}
                        className="col-flex px-1 mb-3"
                      >
                        <PastReleaseCard item={item} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="d-md-none movies-past-mob-rail">
                {pastChunks.map((videos, vi) => (
                  <div key={`mob-${vi}`} className="mob-slider movies-past-mob-slider">
                    <div className="movies-past-mob-strip">
                      {videos.map((item) => (
                        <div key={`m-${movieSlug(item)}`} className="movies-past-mob-slide">
                          <PastReleaseCard item={item} mobile />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {!viewAll && pastRest.length > 0 ?
                <div className="text-center">
                  <div className="dh-relative">
                    <div className="btn-view-more mt15 mb20 text-center">
                      <button
                        type="button"
                        className="btn-1 dh-view-all-btn font-hammersmith display-inline"
                        onClick={() => setViewAll(true)}
                      >
                        <svg aria-hidden="true" focusable="false" style={{ pointerEvents: "none" }}>
                          <rect x="0" y="0" fill="none" width="100%" height="100%" />
                        </svg>
                        <span className="dh-view-all-label">VIEW ALL</span>
                      </button>
                    </div>
                  </div>
                </div>
              : null}

              {viewAll ?
                <>
                  <div className="mobile-row hidden-xs d-none d-md-block movies-past-grid-row">
                    <div className="row-flex text-center flex-wrap justify-content-center">
                      {pastMoreChunks.flatMap((videos, ci) =>
                        videos.map((item, ri) => (
                          <div
                            key={`pm-${ci}-${movieSlug(item) ?? "past"}-${String(item._id ?? item.year ?? ri)}`}
                            className="col-flex px-1 mb-3"
                          >
                            <PastReleaseCard item={item} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="d-md-none movies-past-mob-rail">
                    {pastMoreChunks.map((videos, vi) => (
                      <div key={`pmm-${vi}`} className="mob-slider movies-past-mob-slider">
                        <div className="movies-past-mob-strip">
                          {videos.map((item) => (
                            <div key={`pmm-${movieSlug(item)}`} className="movies-past-mob-slide">
                              <PastReleaseCard item={item} mobile />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              : null}
            </div>
          </div>
        </section>
      : null}
    </>
  );
}
