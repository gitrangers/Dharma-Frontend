import "server-only";
import { cache } from "react";
import { apiPost } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/media";
import {
  isStrapiMoviesEnabled,
  strapiTryFetchNewsArticle,
} from "@/lib/server/movies/strapi";

export type NewsArticleDetail = {
  _id: string;
  title: string;
  dateIso: string;
  bannerUrl?: string;
  imageUrl?: string;
  html: string;
  link?: string;
};

export type NewsRelatedCard = {
  _id: string;
  title: string;
  dateIso: string;
  imageUrl?: string;
};

export type NewsDetailPayload = {
  article: NewsArticleDetail;
  related: NewsRelatedCard[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function legacyDateToIso(v: unknown): string {
  if (v == null) return "";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function mapLegacyArticle(
  raw: Record<string, unknown>,
): NewsArticleDetail | null {
  const _id = raw._id != null ? String(raw._id) : "";
  if (!_id) return null;
  const title = typeof raw.title === "string" ? raw.title : "";
  const bannerRaw = typeof raw.banner === "string" ? raw.banner : "";
  const imageRaw = typeof raw.image === "string" ? raw.image : "";
  const html = typeof raw.text === "string" ? raw.text : "";
  const link = typeof raw.link === "string" ? raw.link.trim() : "";
  return {
    _id,
    title,
    dateIso: legacyDateToIso(raw.date),
    bannerUrl: resolveUploadUrl(bannerRaw),
    imageUrl: resolveUploadUrl(imageRaw),
    html,
    link: link || undefined,
  };
}

function mapLegacyRelatedItem(
  raw: Record<string, unknown>,
): NewsRelatedCard | null {
  const _id = raw._id != null ? String(raw._id) : "";
  if (!_id) return null;
  const title = typeof raw.title === "string" ? raw.title : "";
  const imageRaw =
    typeof raw.image === "string"
      ? raw.image
      : typeof raw.banner === "string"
        ? raw.banner
        : "";
  return {
    _id,
    title,
    dateIso: legacyDateToIso(raw.date),
    imageUrl: resolveUploadUrl(imageRaw),
  };
}

/** Sails `res.callback`: `{ value: true, data: { data: article, related } }`. */
function parseLegacyNewsDetail(json: unknown): NewsDetailPayload | null {
  const root = asRecord(json);
  if (!root) return null;
  if (root.value === false) return null;

  const wrap = asRecord(root.data);
  if (!wrap) return null;

  const articleRaw = asRecord(wrap.data);
  if (!articleRaw) return null;

  const article = mapLegacyArticle(articleRaw);
  if (!article) return null;

  const rel = Array.isArray(wrap.related) ? wrap.related : [];
  const related: NewsRelatedCard[] = [];
  for (const r of rel) {
    const rec = asRecord(r);
    if (!rec) continue;
    const card = mapLegacyRelatedItem(rec);
    if (card) related.push(card);
  }

  return { article, related };
}

function normalizeStrapiNewsDetail(
  raw: Awaited<ReturnType<typeof strapiTryFetchNewsArticle>>,
): NewsDetailPayload | null {
  if (!raw || !raw.article) return null;
  const a = raw.article as {
    _id: string;
    title: string;
    dateIso: string;
    banner: string;
    image: string;
    html: string;
    link: string;
  };
  if (!String(a._id || "").trim()) return null;
  const banner = (a.banner || "").trim();
  const image = (a.image || "").trim();
  const link = (a.link || "").trim();
  return {
    article: {
      _id: String(a._id),
      title: typeof a.title === "string" ? a.title : "",
      dateIso: typeof a.dateIso === "string" ? a.dateIso : "",
      bannerUrl: banner || undefined,
      imageUrl: image || undefined,
      html: typeof a.html === "string" ? a.html : "",
      link: link || undefined,
    },
    related: Array.isArray(raw.related)
      ? raw.related.map((r: unknown) => {
          const row = r as {
            _id: string;
            title: string;
            dateIso: string;
            image: string;
          };
          const im = (row.image || "").trim();
          return {
            _id: String(row._id || ""),
            title: typeof row.title === "string" ? row.title : "",
            dateIso: typeof row.dateIso === "string" ? row.dateIso : "",
            imageUrl: im || undefined,
          };
        })
      : [],
  };
}

/**
 * Single news article for `/news-events/[id]` — Strapi when enabled, else Sails `News/getOneNews`.
 * Wrapped with `cache` so `generateMetadata` + page do one backend round-trip per request.
 */
export const fetchNewsDetailPage = cache(
  async (id: string): Promise<NewsDetailPayload | null> => {
    const trimmed = (id || "").trim();
    if (!trimmed) return null;

    if (isStrapiMoviesEnabled()) {
      const strapi = await strapiTryFetchNewsArticle(trimmed);
      const normalized = normalizeStrapiNewsDetail(strapi);
      if (normalized) return normalized;
    }

    try {
      const raw = await apiPost<unknown>("News/getOneNews", { _id: trimmed });
      return parseLegacyNewsDetail(raw);
    } catch {
      return null;
    }
  },
);
