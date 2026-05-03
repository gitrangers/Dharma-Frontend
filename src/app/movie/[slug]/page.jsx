import { jsx as _jsx } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { fetchOneMovie } from "@/lib/server/movies";
import { MovieInsideView } from "@/components/movie/MovieInsideView";
export default async function MovieDetailPage({ params }) {
    const { slug } = await params;
    const decoded = decodeURIComponent(slug);
    let data;
    try {
        data = await fetchOneMovie(decoded);
    }
    catch (err) {
        console.error("[movie/[slug]] fetchOneMovie failed:", err);
        data = null;
    }
    if (!data) {
        notFound();
    }
    return _jsx(MovieInsideView, { data: data });
}
