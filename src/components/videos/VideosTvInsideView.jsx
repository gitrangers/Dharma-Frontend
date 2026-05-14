"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { VideosSearchBar } from "@/components/videos/VideosSearchBar";
import { resolveUploadUrl } from "@/lib/media";
import {
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeVideoId,
  youtubeWatchUrl,
} from "@/lib/youtube";

function shorten(s, max) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 3))}...`;
}

function rowMatchesFilter(row, q) {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  return String(row.title ?? "")
    .toLowerCase()
    .includes(n);
}

function VideoTileSmall({ item, onOpen }) {
  const thumb =
    resolveUploadUrl(item.thumbnail) || youtubeThumbnailUrl(item.url) || "";
  const title = shorten(String(item.title ?? ""), 60);

  return (
    <div className="col-md-4 col-sm-4 col-6">
      <div className="tv-box">
        <button
          type="button"
          className="dh-video-popup-trigger d-block w-100 text-start text-decoration-none border-0 bg-transparent p-0"
          aria-label={`Play — ${title}`}
          onClick={() => onOpen(item)}
        >
          <div className="img-animated">
            <div className="img-inside-box em-box hover-sec">
              {thumb ?
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="img-responsive width100" />
              : null}
            </div>
          </div>
          <div className="video-names mt10">
            <span className="color-white text-cap m-font12">{title}</span>
          </div>
        </button>
      </div>
    </div>
  );
}

export function VideosTvInsideView({
  movieKey,
  movieTitle,
  videos,
  tags,
  allMovies,
  initialSearch = "",
}) {
  const [search, setSearch] = useState(initialSearch);
  const [popupItem, setPopupItem] = useState(null);

  const visible = useMemo(
    () =>
      [...videos]
        .sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0))
        .filter((r) => rowMatchesFilter(r, search)),
    [videos, search]
  );

  function openClip(item) {
    const embedSrc = youtubeEmbedUrl(item.url);
    if (embedSrc) {
      setPopupItem(item);
      return;
    }
    const watch =
      youtubeWatchUrl(item.url) || String(item.url ?? "").trim();
    if (/^https?:\/\//i.test(watch)) {
      window.open(watch, "_blank", "noopener,noreferrer");
    }
  }

  function closePopup() {
    setPopupItem(null);
  }

  useEffect(() => {
    if (!popupItem) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [popupItem]);

  const embedSrc = popupItem ? youtubeEmbedUrl(popupItem.url) : "";

  return (
    <section className="dharma-top-bg videos-page-legacy videos-tv-inside">
      <div className="container">
        <div className="videos-page-mar">
          <div className="text-center">
            <div className="head-title mt45">
              <h1 className="color-white f120 text-up font-hammersmith margin0">VIDEOS</h1>
            </div>
            {search.trim() ?
              <div className="search-rslt mt15">
                <h3 className="color-primary margin0">Displaying Result For &apos;{search}&apos;</h3>
              </div>
            : null}
            <VideosSearchBar id="videos-search-inside" value={search} onChange={setSearch} />
          </div>

          <div className="row gx-4 videos-tv-inside__grid">
            <div className="col-md-8 col-sm-8 col-7">
              <div className="tv-inside mt60">
                {!search.trim() ?
                  <>
                    <div className="title d-none d-sm-block">
                      <h1 className="ml-7 color-primary font-hammersmith line45 f55 text-up margin0">{movieTitle}</h1>
                    </div>
                    <div className="title d-sm-none">
                      <h1 className="ml-7 color-primary font-hammersmith line45 f55 text-up margin0">
                        {shorten(movieTitle, 10)}
                      </h1>
                    </div>
                  </>
                : null}
              </div>

              <div className="text-shadow">
                {visible.length === 0 ?
                  <p className="color-white">No clips match this filter.</p>
                : (
                  <div className="row g-2">
                    {visible.map((item, idx) => (
                      <VideoTileSmall
                        key={`${youtubeVideoId(item.url)}-${idx}`}
                        item={item}
                        onOpen={openClip}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-4 col-sm-4 col-5">
              <div className="border-left tv-inside-sidebar">
                <div className="tv-inside-sidebar__section tv-inside-sidebar__section--tags">
                  <h3 className="color-primary mt30 margin0 tv-inside-sidebar__heading">
                    POPULAR TAGS
                  </h3>
                  <ul className="list-none color-white padding0 tv-inside-sidebar__list">
                    {tags.map((t) => (
                      <li key={String(t._id ?? t.name)} className="mb-1 tv-inside-sidebar__item">
                        <Link href={`/videos?q=${encodeURIComponent(String(t.name ?? ""))}`}>{t.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="tv-inside-sidebar__section tv-inside-sidebar__section--movies">
                  <h3 className="color-primary mt30 margin0 tv-inside-sidebar__heading">
                    OTHER MOVIES
                  </h3>
                  <ul className="list-none color-white padding0 tv-inside-sidebar__list">
                    {allMovies.map((m) => {
                      const id = String(m._id ?? "");
                      const isCurrent = id === movieKey;
                      return (
                        <li key={id || String(m.name)} className="mb-1 tv-inside-sidebar__item">
                          {isCurrent ?
                            <span className="color-primary fw-semibold">{m.name}</span>
                          : <Link href={`/videos/${encodeURIComponent(id)}`}>{m.name}</Link>
                          }
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* <p className="text-center mt40 mb-0 pt-4">
            <Link href="/videos" className="btn btn-outline-light font-hammersmith me-2">
              All videos
            </Link>
            <Link href="/" className="btn btn-outline-light font-hammersmith">
              Home
            </Link>
          </p> */}
        </div>
      </div>

      {embedSrc ?
        <div
          className="dh-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Video player"
          onClick={closePopup}
        >
          <div className="dh-modal-frame" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="dh-modal-close" onClick={closePopup} aria-label="Close video">
              ×
            </button>
            <iframe
              key={youtubeVideoId(popupItem?.url)}
              title={String(popupItem?.title ?? popupItem?.name ?? "Video")}
              src={embedSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      : null}
    </section>
  );
}
