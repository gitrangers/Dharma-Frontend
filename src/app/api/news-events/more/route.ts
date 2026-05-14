import { NextResponse } from "next/server";
import { fetchJsonWithRevalidate } from "@/lib/server/fetchJson";
import { buildNewsListStrapiUrl } from "@/lib/newsEventsListQuery";
import {
  mapStrapiNewsListItem,
  NEWS_LIST_REVALIDATE_SEC,
} from "@/lib/server/strapiNewsList";

export const dynamic = "force-dynamic";

/**
 * GET ?page=2&q=&month=&year=
 * Returns next page of news for infinite scroll on `/news-events`.
 */
export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const page = Math.max(1, Number(u.searchParams.get("page") || "1"));
    const q = (u.searchParams.get("q") || "").trim();
    const month = (u.searchParams.get("month") || "").trim();
    const year = (u.searchParams.get("year") || "").trim();

    const strapiUrl = buildNewsListStrapiUrl({ page, q, month, year });
    const json = (await fetchJsonWithRevalidate(
      strapiUrl,
      NEWS_LIST_REVALIDATE_SEC,
    )) as {
      data?: unknown[];
      meta?: { pagination?: { pageCount?: number; page?: number; pageSize?: number } };
    };

    const rows = Array.isArray(json?.data) ? json.data : [];
    const items = rows.map((row) => mapStrapiNewsListItem(row));
    const pagination = json?.meta?.pagination || {};
    const pageCount = Number(pagination.pageCount ?? 1);

    return NextResponse.json({
      items,
      page: Number(pagination.page ?? page),
      pageCount,
      pageSize: Number(pagination.pageSize ?? rows.length),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load news";
    return NextResponse.json({ error: msg, items: [], page: 1, pageCount: 1 }, { status: 500 });
  }
}
