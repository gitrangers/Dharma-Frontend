import { NextResponse } from "next/server";
import { strapiFetchNewsListForMovieSlug } from "@/lib/server/movies/strapi";

/**
 * Per-movie news (legacy Sails `Movie/getMovieNews` + Mongo `News` by `movie`).
 * Next reads Strapi collections filtered by parent movie — same tab as wallpapers / gallery.
 *
 * GET  /api/news-lists?slug=<urlName>
 * POST /api/news-lists  { "slug": "<urlName>" }
 *
 * Response shape aligned with Sails: `{ value: true, data: NewsDoc[] }`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return NextResponse.json({ value: false, data: "Missing slug query parameter" }, { status: 400 });
  }
  try {
    const data = await strapiFetchNewsListForMovieSlug(slug);
    return NextResponse.json({ value: true, data });
  } catch (e) {
    console.error("[api/news-lists GET]", e);
    return NextResponse.json(
      { value: false, data: e instanceof Error ? e.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ value: false, data: "Invalid JSON" }, { status: 400 });
  }
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const slug =
    typeof b.slug === "string" ? b.slug.trim()
    : typeof b.urlName === "string" ? b.urlName.trim()
    : "";
  if (!slug) {
    return NextResponse.json(
      { value: false, data: "Missing slug or urlName in JSON body" },
      { status: 400 },
    );
  }
  try {
    const data = await strapiFetchNewsListForMovieSlug(slug);
    return NextResponse.json({ value: true, data });
  } catch (e) {
    console.error("[api/news-lists POST]", e);
    return NextResponse.json(
      { value: false, data: e instanceof Error ? e.message : "Server error" },
      { status: 500 },
    );
  }
}
