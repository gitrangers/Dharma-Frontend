/** Mirrors MoviesCtrl.populateData / movies.html structure */

export type MovieRecord = {
  _id?: string;
  urlName?: string;
  name?: string;
  year?: number;
  status?: boolean;
  releaseType?: string;
  upcomingOrder?: number;
  bigImage?: string;
  mediumImage?: string;
  smallImage?: string;
  upcomingSmall?: string;
  recentSmall?: string;
  /** Movie detail fields (present when API sends full objects) */
  releaseDate?: string | Date;
  director?: string;
  mainCast?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  if (!arr.length) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function groupByReleaseType(rows: MovieRecord[]): Record<string, MovieRecord[]> {
  return rows.reduce<Record<string, MovieRecord[]>>((acc, m) => {
    const key = m.releaseType || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
}

/** Outer slides of 4, inner chunk(..., 4) for template rows — matches _.chunk(_.chunk(Recent,4),4) loop */
export function layoutRecent(recentRaw: MovieRecord[]): MovieRecord[][][] {
  const recent = [...recentRaw].sort(
    (a, b) => (b.upcomingOrder ?? 0) - (a.upcomingOrder ?? 0)
  );
  const outer = chunk(recent, 4);
  return outer.map((group) => chunk(group, 4));
}

export function layoutPast(pastRaw: MovieRecord[]): {
  pastChunks: MovieRecord[][];
  pastMoreChunks: MovieRecord[][];
} {
  const past = [...pastRaw].sort(
    (a, b) => (b.upcomingOrder ?? 0) - (a.upcomingOrder ?? 0)
  );
  const first10 = past.slice(0, 10);
  const rest = past.slice(10);
  return {
    pastChunks: chunk(first10, 5),
    pastMoreChunks: chunk(rest, 5),
  };
}

export function buildMovieList(details: MovieRecord[]) {
  const g = groupByReleaseType(details);
  const upcoming = [...(g["Upcoming"] ?? [])].sort(
    (a, b) => (a.upcomingOrder ?? 0) - (b.upcomingOrder ?? 0)
  );
  const recentRaw = g["Recent"] ?? [];
  const pastRaw = g["Past"] ?? [];

  return {
    upcoming,
    recentSlides: layoutRecent(recentRaw),
    ...layoutPast(pastRaw),
  };
}

export function movieSlug(m: MovieRecord): string {
  const s = m.urlName || m._id;
  return s ? String(s) : "";
}

/** Thumbnail for search dropdown — matches Angular movies.html ui-select-choices */
export function movieSearchThumbnail(m: MovieRecord): string | undefined {
  const rt = m.releaseType;
  if (rt === "Past") return m.smallImage;
  if (rt === "Recent") return m.recentSmall ?? m.mediumImage ?? m.smallImage;
  if (rt === "Upcoming") return m.upcomingSmall ?? m.mediumImage ?? m.smallImage;
  return m.mediumImage ?? m.smallImage ?? m.upcomingSmall ?? m.recentSmall;
}
