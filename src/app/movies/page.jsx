import { jsx as _jsx } from "react/jsx-runtime";
import { MoviesPageView } from "@/components/movies/MoviesPageView";
import { fetchAllMovieName, fetchMovieDetails } from "@/lib/server/movies";
/**
 * Movie grids come only from Strapi (`GET {STRAPI_URL}/api/movies`).
 */
async function loadDetails() {
    try {
        return (await fetchMovieDetails());
    }
    catch (err) {
        console.error("[movies] Strapi fetch failed:", err);
        return [];
    }
}
async function loadSearchNames() {
    try {
        return (await fetchAllMovieName());
    }
    catch (err) {
        console.error("[movies] Strapi movie names fetch failed:", err);
        return [];
    }
}
export default async function MoviesPage({ searchParams }) {
    const sp = await Promise.resolve(searchParams);
    const qRaw = sp && typeof sp.q === "string" ? sp.q : "";
    const initialSearchQuery = qRaw.trim();
    const [details, searchNames] = await Promise.all([loadDetails(), loadSearchNames()]);
    return _jsx(MoviesPageView, { initialDetails: details, searchNames: searchNames, initialSearchQuery });
}
