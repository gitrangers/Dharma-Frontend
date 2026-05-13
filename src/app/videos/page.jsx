import { Suspense } from "react";
import { VideosPageView } from "@/components/videos/VideosPageView";
import { buildMovieTitleLookups } from "@/lib/videosTitles";
import { resolveUploadUrl } from "@/lib/media";
import { youtubeThumbnailUrlMax, youtubeThumbnailUrl } from "@/lib/youtube";
import {
  fetchAllDharmaTv,
  fetchAllMovieNamesForTv,
  fetchDharmaTvSlider,
} from "@/lib/server/dharmatv";
import {
  buildStrapiVideoNavFromRows,
  fetchStrapiDharmaSliderHeroSlides,
  fetchStrapiDharmaTvFlattenedRows,
  fetchStrapiDharmaTvsFlattenedRows,
  fetchStrapiDharmaTvHeroSlides,
  fetchStrapiMovieNamesForVideosNav,
  hasStrapiUrl,
  isStrapiMoviesEnabled,
} from "@/lib/server/movies/strapi";

async function loadVideosHeroSlider() {
  if (!hasStrapiUrl()) return fetchDharmaTvSlider();
  const fromCms = await fetchStrapiDharmaSliderHeroSlides();
  if (fromCms.length > 0) return fromCms;
  if (isStrapiMoviesEnabled()) return fetchStrapiDharmaTvHeroSlides();
  return fetchDharmaTvSlider();
}

export default async function VideosPage({ searchParams }) {
  const q = searchParams ? (await searchParams).q?.trim() || "" : "";

  let slider = [];
  let rows = [];
  let movieNameRows = [];
  try {
    if (hasStrapiUrl()) {
      const tvsRows = await fetchStrapiDharmaTvsFlattenedRows();
      if (tvsRows.length > 0) {
        rows = tvsRows;
        movieNameRows = buildStrapiVideoNavFromRows(tvsRows);
        slider = await loadVideosHeroSlider();
      } else if (isStrapiMoviesEnabled()) {
        ;[slider, rows, movieNameRows] = await Promise.all([
          loadVideosHeroSlider(),
          fetchStrapiDharmaTvFlattenedRows(),
          fetchStrapiMovieNamesForVideosNav(),
        ]);
      } else {
        ;[slider, rows, movieNameRows] = await Promise.all([
          loadVideosHeroSlider(),
          fetchAllDharmaTv(),
          fetchAllMovieNamesForTv(),
        ]);
      }
    } else if (isStrapiMoviesEnabled()) {
      ;[slider, rows, movieNameRows] = await Promise.all([
        loadVideosHeroSlider(),
        fetchStrapiDharmaTvFlattenedRows(),
        fetchStrapiMovieNamesForVideosNav(),
      ]);
    } else {
      ;[slider, rows, movieNameRows] = await Promise.all([
        loadVideosHeroSlider(),
        fetchAllDharmaTv(),
        fetchAllMovieNamesForTv(),
      ]);
    }
  } catch (err) {
    console.error("[videos] fetch failed:", err);
  }

  const movieTitleLookups = buildMovieTitleLookups(movieNameRows);

  // Derive the first hero image URL server-side so we can emit a <link rel="preload">
  // before the client bundle executes — directly reduces LCP on mobile.
  const firstHero = [...slider].sort(
    (a, b) => (Number(b.order) || 0) - (Number(a.order) || 0),
  )[0];
  const heroPreloadSrc = firstHero
    ? (resolveUploadUrl(String(firstHero.image ?? "")) ||
       youtubeThumbnailUrlMax(String(firstHero.url ?? "")) ||
       youtubeThumbnailUrl(String(firstHero.url ?? "")) ||
       "")
    : "";

  return (
    <>
      {/*
       * Preload the page background (tv-bg.jpg) — it is referenced only in CSS so
       * the browser cannot discover it until after CSSOM construction; an explicit
       * preload link moves the fetch to the very start of the critical path.
       */}
      <link rel="preload" as="image" href="/frontend/img/tv-bg.jpg" />
      {heroPreloadSrc ? (
        /* Preload the first hero thumbnail */
        // eslint-disable-next-line @next/next/no-img-element
        <link
          rel="preload"
          as="image"
          href={heroPreloadSrc}
          imageSizes="(max-width: 575px) 88vw, 78vw"
        />
      ) : null}
    <Suspense fallback={<section className="dharma-top-bg videos-page-legacy min-vh-content" />}>
      <VideosPageView
        slider={slider}
        videos={rows}
        movieTitleLookups={movieTitleLookups}
        initialSearch={q}
      />
    </Suspense>
    </>
  );
}
