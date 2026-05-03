"use client";

import Image from "next/image";

/**
 * Matches DharmaNodeRun `dharma-tv.html`: `.search-movie.search-movie-mar` + `input.search-in`
 * (width from `search-movie-mar`, border on input, 45px height, `padding-left: 45px` for icon).
 */
export function VideosSearchBar({ value, onChange, id = "videos-search" }) {
  const hasClear = Boolean(value.trim());

  const cls = ["search-movie dh-relative search-movie-mar mx-auto w-100"];
  if (hasClear) cls.push("search-movie--has-clear");

  return (
    <div className={cls.join(" ")}>
      <div className="search-img">
        <Image
          src="/frontend/img/search.png"
          alt=""
          width={20}
          height={20}
          priority={false}
        />
      </div>
      <label htmlFor={id} className="visually-hidden">
        Search for your favourite movie or actor
      </label>
      <input
        id={id}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        className="search-in"
        placeholder="Search for your favourite movie or actor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hasClear ?
        <button
          type="button"
          className="search-img2 border-0 bg-transparent p-0"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <Image src="/frontend/img/error.png" alt="" width={22} height={22} />
        </button>
      : null}
    </div>
  );
}
