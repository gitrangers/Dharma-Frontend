import "server-only";
import { isStrapiMoviesEnabled, strapiTryFetchOneMovie } from "@/lib/server/movies/strapi";

/**
 * Movie detail page — Strapi only (`/api/movies` with populate).
 */
export async function fetchOneMovie(slug) {
  if (!isStrapiMoviesEnabled()) {
    console.warn(
      "[movie] STRAPI_URL and STRAPI_API_TOKEN (or STRAPI_AUTH_TOKEN JWT) are both required.",
    );
    return null;
  }
  return await strapiTryFetchOneMovie(slug);
}
