"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

function formatDate(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

export default function NewsEventsGridClient({ items }) {
  const gridRef = useRef(null);

  useEffect(() => {
    const root = gridRef.current;
    if (!root) return undefined;

    const cards = Array.from(root.querySelectorAll(".masonry-brick"));
    if (cards.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [items]);

  return (
    <div ref={gridRef} className="movie-news-grid movie-news-grid--reveal margin-auto">
      {items.map((item, index) => (
        <article
          className="masonry-brick masonry-link"
          key={item._id}
          style={{ transitionDelay: `${Math.min(index % 12, 11) * 45}ms` }}
        >
          <Link href={`/news-events/${item._id}`}>
            <div className="masonry-box">
              <div className="img-animate">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="img-responsive"
                    loading={index < 6 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : null}
              </div>
              <div className="padd10">
                <div className="news-title">
                  <h4 className="margin0">{item.title}</h4>
                </div>
                <div className="news-date">
                  <span className="f12">{formatDate(item.date)}</span>
                </div>
              </div>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
