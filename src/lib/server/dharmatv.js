import "server-only";
import { apiPost, unwrapList } from "@/lib/api";
import { buildUrlName } from "@/lib/movieModel";

/** @param {unknown} row */
function enrichTvRow(row) {
  if (!row || typeof row !== "object") return row;
  const r = row;
  const m =
    r.movie && typeof r.movie === "object" ? { ...r.movie }
    : {};
  const name = typeof m.name === "string" ? m.name : "";
  const year = Number(m.year) || 0;
  const movieKey = buildUrlName(name, year);
  return {
    ...r,
    movieKey,
    movie: { ...m, name },
  };
}

export async function fetchDharmaTvSlider() {
  try {
    const json = await apiPost("dharmaslider/getAllDharmaTvSlider", {});
    return unwrapList(json);
  } catch {
    return [];
  }
}

export async function fetchAllDharmaTv() {
  try {
    const json = await apiPost("Dharmatv/getAll", {});
    const list = unwrapList(json);
    return list.map((row) => enrichTvRow(row));
  } catch {
    return [];
  }
}

/** Same shape as Angular `Movie/getAllMovieName` + `_id` → `urlName` for links. */
export async function fetchAllMovieNamesForTv() {
  try {
    const json = await apiPost("Movie/getAllMovieName", {});
    const list = unwrapList(json);
    return list.map((m) => {
      if (!m || typeof m !== "object") return m;
      const row = m;
      /** Preserve original `_id` before we alias it to `urlName` (for Tv row → canonical title join). */
      const mongoId =
        row._id != null && String(row._id).trim() ? String(row._id).trim() : "";
      const urlName =
        typeof row.urlName === "string" && row.urlName.trim() ?
          row.urlName.trim()
        : buildUrlName(
            typeof row.name === "string" ? row.name : "",
            Number(row.year) || 0
          );
      return { ...row, mongoId, _id: urlName, urlName };
    });
  } catch {
    return [];
  }
}

export async function fetchAllTags() {
  try {
    const json = await apiPost("tag/getAll", {});
    return unwrapList(json);
  } catch {
    return [];
  }
}
