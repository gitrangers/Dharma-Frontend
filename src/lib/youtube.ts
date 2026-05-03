/** YouTube id or URL → 11-char video id (best effort). */
export function youtubeVideoId(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/i
  );
  return m ? m[1] : "";
}

/** Open in a normal browser tab — use this for `<a href>`. `/embed/` in a top-level tab often shows YouTube error 153. */
export function youtubeWatchUrl(raw: unknown): string {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube.com/watch?v=${id}` : "";
}

/** Iframe `src` only — not for opening in a new tab. */
export function youtubeEmbedUrl(raw: unknown): string {
  const id = youtubeVideoId(raw);
  return id ?
      `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=0&showinfo=0&rel=0&loop=1`
    : "";
}

export function youtubeThumbnailUrl(raw: unknown): string {
  const id = youtubeVideoId(raw);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

/** Highest common static thumb (may 404 for very old videos — fallback in UI). */
export function youtubeThumbnailUrlMax(raw: unknown): string {
  const id = youtubeVideoId(raw);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "";
}
