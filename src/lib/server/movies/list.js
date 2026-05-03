import "server-only";
import {
  isStrapiMoviesEnabled,
  strapiFetchAllMovieName,
  strapiFetchAllRecentMovies,
  strapiFetchAllUpcomingMovies,
  strapiFetchMovieDetails,
} from "@/lib/server/movies/strapi";

function ensureStrapiMovies() {
  if (!isStrapiMoviesEnabled()) {
    console.warn(
      "[movies] Set STRAPI_URL and a valid JWT in STRAPI_API_TOKEN (or STRAPI_AUTH_TOKEN) — both are required; movie lists are empty.",
    );
    return false;
  }
  return true;
}

/** Full grid / sort data (Strapi). */
export async function fetchMovieDetails() {
  if (!ensureStrapiMovies()) return [];
  return await strapiFetchMovieDetails();
}

/** Search / name list (Strapi). */
export async function fetchAllMovieName() {
  if (!ensureStrapiMovies()) return [];
  return await strapiFetchAllMovieName();
}

/** Upcoming ribbon (Strapi). */
export async function fetchAllUpcomingMovies() {
  if (!ensureStrapiMovies()) return [];
  return await strapiFetchAllUpcomingMovies();
}

/** Recent ribbon (Strapi). */
export async function fetchAllRecentMovies() {
  if (!ensureStrapiMovies()) return [];
  return await strapiFetchAllRecentMovies();
}
