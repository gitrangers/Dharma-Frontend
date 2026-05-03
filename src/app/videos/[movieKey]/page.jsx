import { notFound } from "next/navigation";
import { VideosTvInsideView } from "@/components/videos/VideosTvInsideView";
import {
  buildMovieTitleLookups,
  resolveMovieTitleFromTvRow,
} from "@/lib/videosTitles";
import {
  fetchAllDharmaTv,
  fetchAllMovieNamesForTv,
  fetchAllTags,
} from "@/lib/server/dharmatv";
import {
  collectPopularTagsFromDharmaTvRows,
  fetchStrapiDharmaTvFlattenedRows,
  fetchStrapiDharmaTvsFlattenedRows,
  fetchStrapiMovieNamesForVideosNav,
  hasStrapiUrl,
  isStrapiMoviesEnabled,
} from "@/lib/server/movies/strapi";

export default async function VideosTvInsidePage({ params, searchParams }) {
  const { movieKey: raw } = await params;
  const movieKey = decodeURIComponent(raw);
  const q = searchParams ? (await searchParams).q?.trim() || "" : "";

  let allRaw = [];
  let names = [];
  let tags = [];
  try {
    if (hasStrapiUrl()) {
      const tvs = await fetchStrapiDharmaTvsFlattenedRows();
      if (tvs.length > 0) {
        allRaw = tvs;
        tags = collectPopularTagsFromDharmaTvRows(tvs);
        // OTHER MOVIES: keep full catalog + legacy sort (same as Sails / Strapi movies nav),
        // not the dharma-tvs-only alphabetical list from buildStrapiVideoNavFromRows.
        names = isStrapiMoviesEnabled() ?
          await fetchStrapiMovieNamesForVideosNav()
        : await fetchAllMovieNamesForTv();
      } else if (isStrapiMoviesEnabled()) {
        ;[allRaw, names, tags] = await Promise.all([
          fetchStrapiDharmaTvFlattenedRows(),
          fetchStrapiMovieNamesForVideosNav(),
          fetchAllTags(),
        ]);
      } else {
        ;[allRaw, names, tags] = await Promise.all([
          fetchAllDharmaTv(),
          fetchAllMovieNamesForTv(),
          fetchAllTags(),
        ]);
      }
    } else if (isStrapiMoviesEnabled()) {
      ;[allRaw, names, tags] = await Promise.all([
        fetchStrapiDharmaTvFlattenedRows(),
        fetchStrapiMovieNamesForVideosNav(),
        fetchAllTags(),
      ]);
    } else {
      ;[allRaw, names, tags] = await Promise.all([
        fetchAllDharmaTv(),
        fetchAllMovieNamesForTv(),
        fetchAllTags(),
      ]);
    }
  } catch (err) {
    console.error("[videos/movieKey] fetch failed:", err);
  }

  const mine = allRaw.filter(
    (v) => typeof v.movieKey === "string" && v.movieKey === movieKey
  );
  if (!mine.length) {
    notFound();
  }

  const lookups = buildMovieTitleLookups(names);
  const movieTitle = resolveMovieTitleFromTvRow(mine[0], lookups);

  return (
    <VideosTvInsideView
      movieKey={movieKey}
      movieTitle={movieTitle}
      videos={mine}
      tags={tags}
      allMovies={names}
      initialSearch={q}
    />
  );
}
