"use client";

import Masonry from "react-masonry-css";
import { resolveUploadUrl } from "@/lib/media";

const breakpointCols = {
  default: 3,
  991: 2,
  575: 1,
};

/**
 * Legacy-style variable-height masonry (3 / 2 / 1 columns) for movie Gallery and Behind the scenes.
 * @param {{ items: { image?: string }[]; idPrefix: string; onImageClick: (url: string | null) => void }} props
 */
export function MovieInsideGalleryMasonry({ items, idPrefix, onImageClick }) {
  const withImages = items.filter((item) => Boolean(item?.image));
  return (
    <Masonry
      breakpointCols={breakpointCols}
      className="movie-gallery-masonry movie-gallery-grid movie-gallery-grid--animated"
      columnClassName="movie-gallery-masonry__column"
    >
      {withImages.map((item, i) => (
        <button
          key={`${idPrefix}-${item._id || i}`}
          type="button"
          className="masonry-brick masonry-link"
          style={{ animationDelay: `${Math.min(i, 28) * 45}ms` }}
          onClick={() => onImageClick(resolveUploadUrl(item.image) || null)}
        >
          <div className="masonry-box img-animate">
            <img
              src={resolveUploadUrl(item.image, { width: 400 }) || ""}
              alt="Dharma Production"
            />
          </div>
        </button>
      ))}
    </Masonry>
  );
}
