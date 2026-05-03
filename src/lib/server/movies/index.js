/**
 * Movie data — Strapi only (`STRAPI_URL` + optional `STRAPI_API_TOKEN`).
 */
export {
  fetchMovieDetails,
  fetchAllMovieName,
  fetchAllUpcomingMovies,
  fetchAllRecentMovies,
} from "./list";

export { fetchOneMovie } from "./detail";

export {
  isStrapiMoviesEnabled,
  strapiFetchMovieDetails,
  strapiFetchAllMovieName,
  strapiFetchAllUpcomingMovies,
  strapiFetchAllRecentMovies,
  strapiTryFetchOneMovie,
} from "./strapi";
