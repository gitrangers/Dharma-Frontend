"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useRef } from "react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { movieSlug } from "@/lib/moviesLayout";
import { resolveUploadUrl } from "@/lib/media";
import "swiper/css";
import "swiper/css/pagination";
function ordinalSuffix(day) {
    const j = day % 10;
    const k = day % 100;
    if (k >= 11 && k <= 13)
        return "th";
    if (j === 1)
        return "st";
    if (j === 2)
        return "nd";
    if (j === 3)
        return "rd";
    return "th";
}
/** e.g. "22nd January 2026" — matches legacy presentation */
function formatReleaseLine(d) {
    if (d === undefined || d === null || d === "")
        return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime()))
        return "";
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const day = dt.getDate();
    return `${day}${ordinalSuffix(day)} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}
function UpcomingMetaBar({ item }) {
    const release = formatReleaseLine(item.releaseDate);
    const director = item.director?.trim();
    const cast = item.mainCast?.trim();
    if (!release && !director && !cast)
        return null;
    return (_jsx("div", { className: "movies-upcoming-meta px-3 py-2 px-md-4", children: _jsxs("div", { className: "movies-upcoming-meta-inner font-karla small text-dark", children: [release ?
                    _jsxs(_Fragment, { children: [_jsx("span", { className: "movies-upcoming-meta-label", children: "Release Date: " }), _jsx("span", { className: "color-primary fw-semibold", children: release })] })
                    : null, director ?
                    _jsxs(_Fragment, { children: [release ?
                                _jsx("span", { className: "movies-upcoming-meta-sep text-primary", children: " | " })
                                : null, _jsx("span", { className: "movies-upcoming-meta-label", children: "Director: " }), _jsx("span", { children: director })] })
                    : null, cast ?
                    _jsxs(_Fragment, { children: [release || director ?
                                _jsx("span", { className: "movies-upcoming-meta-sep text-primary", children: " | " })
                                : null, _jsx("span", { className: "movies-upcoming-meta-label", children: "Main Cast: " }), _jsx("span", { children: cast })] })
                    : null] }) }));
}
/** Card ~70–80% viewport width, arrows outside card — parity with reference UI */
export function UpcomingReleasesSlider({ items }) {
    const swiperRef = useRef(null);
    if (items.length === 0)
        return null;
    const loop = items.length > 1;
    return (_jsx("div", { className: "movies-upcoming-outer common-class", children: _jsxs("div", { className: "movies-upcoming-row", children: [_jsx("button", { type: "button", className: "movies-upcoming-arrow movies-upcoming-arrow--prev align-self-center", "aria-label": "Previous slide", onClick: () => swiperRef.current?.slidePrev(), children: _jsx("i", { className: "fa-solid fa-chevron-left movies-upcoming-arrow-icon", "aria-hidden": true }) }), _jsx("div", { className: "movies-upcoming-card-column", children: _jsx(Swiper, { modules: [Autoplay, Pagination], loop: loop, autoplay: {
                            delay: 2000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        }, speed: 600, slidesPerView: 1, spaceBetween: 0, pagination: {
                            clickable: true,
                            dynamicBullets: items.length > 5,
                        }, grabCursor: true, onSwiper: (swiper) => {
                            swiperRef.current = swiper;
                        }, className: "movies-upcoming-swiper-inner", children: items.map((item) => (_jsx(SwiperSlide, { className: "movies-upcoming-slide", children: _jsx("div", { className: "video-box px-0", children: _jsxs("div", { className: "video-slide-img movies-upcoming-frame", children: [item.status ?
                                            _jsx(Link, { href: `/movie/${encodeURIComponent(movieSlug(item))}`, className: "d-block", children: _jsx("img", { src: resolveUploadUrl(item.bigImage) || "/frontend/img/logo.png", alt: item.name || "Upcoming", className: "img-responsive w-100 upcoming-slide-img rounded-0" }) })
                                            : // eslint-disable-next-line @next/next/no-img-element
                                                _jsx("img", { src: resolveUploadUrl(item.bigImage) || "/frontend/img/logo.png", alt: item.name || "Upcoming", className: "img-responsive w-100 upcoming-slide-img rounded-0" }), _jsx(UpcomingMetaBar, { item: item })] }) }) }, movieSlug(item)))) }) }), _jsx("button", { type: "button", className: "movies-upcoming-arrow movies-upcoming-arrow--next align-self-center", "aria-label": "Next slide", onClick: () => swiperRef.current?.slideNext(), children: _jsx("i", { className: "fa-solid fa-chevron-right movies-upcoming-arrow-icon", "aria-hidden": true }) })] }) }));
}
