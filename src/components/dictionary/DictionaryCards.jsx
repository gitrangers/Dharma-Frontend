"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { resolveUploadUrl } from "@/lib/media";

function dictionaryImageSrc(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return resolveUploadUrl(s) || "";
}

export default function DictionaryCards({ items }) {
  const gridRef = useRef(null);

  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll(".dict-card-reveal"));
    if (!cards.length) return;
    const obs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            o.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [items]);

  if (!items?.length) {
    return (
      <p className="text-center small text-white opacity-75">
        Dictionary entries are loading or unavailable.
      </p>
    );
  }

  return (
    <div ref={gridRef} className="dictionary-masonry">
      {items.map((item, index) => {
        const src = dictionaryImageSrc(item.imagePath);
        return (
          <article
            key={item.key ?? `d-${index}`}
            className="dictionary-card bg-white dict-card-reveal"
            style={{ transitionDelay: `${Math.min(index % 9, 8) * 55}ms` }}
          >
            <div className="dictionary-card__media dh-relative">
              {/* Use plain <img> so animated GIFs play (next/image strips animation) */}
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  className="dictionary-card__gif-image"
                  loading={index < 6 ? "eager" : "lazy"}
                  decoding="async"
                />
              ) : (
                <div className="dictionary-card__img-placeholder" />
              )}
              {/* GIF badge — top-left corner like legacy `frontend/img/dicks/gif.png` */}
              <div className="dictionary-card__gif-badge">
                <Image
                  src="/frontend/img/dicks/gif.png"
                  alt="GIF"
                  width={46}
                  height={46}
                  className="dictionary-card__gif-icon"
                  unoptimized
                />
              </div>
            </div>

            <div className="padd10">
              {item.title ? (
                <h4 className="margin0 color-primary dict-card-title">{item.title}</h4>
              ) : null}
              {item.name ? (
                <span className="color-dark d-block dict-card-name">{item.name}</span>
              ) : null}
              {item.grammar ? (
                <div className="news-date dg-pd">
                  <span className="color-dark">-{item.grammar}</span>
                </div>
              ) : null}
              {item.description ? (
                <div className="news-date">
                  <span className="color-dark">-{item.description}</span>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
