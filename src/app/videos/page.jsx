import { Suspense } from "react";
import { VideosPageView } from "@/components/videos/VideosPageView";
import { buildMovieTitleLookups } from "@/lib/videosTitles";
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

  return (
    <Suspense fallback={<section className="dharma-top-bg videos-page-legacy min-vh-content" />}>
      <VideosPageView
        slider={slider}
        videos={rows}
        movieTitleLookups={movieTitleLookups}
        initialSearch={q}
      />
    </Suspense>
  );
}
