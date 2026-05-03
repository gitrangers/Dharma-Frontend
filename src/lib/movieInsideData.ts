import type {
  CastEntry,
  CrewEntry,
  GalleryEntry,
  BehindTheScenesEntry,
  VideoEntry,
  WallpaperEntry,
  RelatedMoviePopulated,
  MovieDoc,
} from "@/lib/movieModel";
import type { NewsDoc } from "@/lib/newsModel";
import type { NewAwardDoc } from "@/lib/awardModel";

export type MovieInsideData = {
  movie: MovieDoc & { _id: string; urlName: string };
  cast: CastEntry[];
  crew: CrewEntry[];
  gallery: GalleryEntry[];
  wallpaper: WallpaperEntry[];
  videos: VideoEntry[];
  behindTheScenes: BehindTheScenesEntry[];
  related: RelatedMoviePopulated[];
  news: NewsDoc[];
  award: NewAwardDoc[];
};
