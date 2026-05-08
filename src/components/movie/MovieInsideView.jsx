"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { resolveUploadUrl } from "@/lib/media";
import { MovieInsideGalleryMasonry } from "@/components/movie/MovieInsideGalleryMasonry";
function youtubeThumb(id) {
    if (!id)
        return undefined;
    return `https://img.youtube.com/vi/${id}/sddefault.jpg`;
}
function youtubeEmbed(id) {
    if (!id)
        return undefined;
    return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=0&showinfo=0&rel=0&loop=1`;
}
function shorten(input, max) {
    const s = (input || "").toString();
    return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}
/** UTC-based so server render matches the browser (avoids hydration drift from time zones). */
function formatNewsDate(d) {
    if (!d)
        return "";
    try {
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime()))
            return "";
        return new Intl.DateTimeFormat("en-GB", {
            timeZone: "UTC",
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(dt);
    }
    catch {
        return "";
    }
}
function groupCrewIntoColumns(crew) {
    const rows = [];
    for (let i = 0; i < crew.length; i += 2) {
        rows.push({ left: crew[i], right: crew[i + 1] });
    }
    return rows;
}
/** Same shell + masonry for Gallery and Behind the scenes (legacy movie-inside parity). */
function MovieInsideImageMasonryPane({ cutImage, items, idPrefix, onImageClick }) {
    const style = cutImage ?
        {
            background: `url(${cutImage}) no-repeat`,
            backgroundSize: "contain",
            backgroundPosition: "right bottom",
            paddingTop: 20,
            paddingBottom: 30,
        }
    : undefined;
    return (_jsx("div", { children: _jsx("div", { className: "movie-inside-date bg-cast cast-credit", style, children: _jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-11 col-sm-11 col-12", children: _jsx("div", { className: "all-movies masonry-width", children: _jsx(MovieInsideGalleryMasonry, { items, idPrefix, onImageClick }) }) }), _jsx("div", { className: "col-md-1 col-sm-1 d-none d-sm-block", children: _jsx(SocialShare, {}) })] }) }) }));
}
export function MovieInsideView({ data }) {
    const movie = data.movie;
    const cast = data.cast || [];
    const crew = data.crew || [];
    const gallery = data.gallery || [];
    const wallpaper = data.wallpaper || [];
    const videos = data.videos || [];
    const behindTheScenes = data.behindTheScenes || [];
    const related = data.related || [];
    const news = data.news || [];
    const awards = data.award || [];
    const mainCast = cast.filter((c) => c.type === "Cast");
    const subCast = cast.filter((c) => c.type === "Sub-cast");
    const tabs = useMemo(() => [
        {
            id: "synopsis",
            label: "Synopsis",
            enabled: !!(movie.synopsis && movie.synopsis.trim().length > 0),
        },
        { id: "cast", label: "CAST & CREDITS", enabled: cast.length > 0 },
        { id: "news", label: "News", enabled: news.length > 0 },
        { id: "gallery", label: "Gallery", enabled: gallery.length > 0 },
        {
            id: "scene",
            label: "behind the scenes",
            enabled: behindTheScenes.length > 0,
        },
        { id: "video", label: "VIDEOS", enabled: videos.length > 0 },
        { id: "wallpapper", label: "WALLPAPERS", enabled: wallpaper.length > 0 },
        { id: "awards", label: "AWARDS", enabled: awards.length > 0 },
    ], [
        movie.synopsis,
        cast.length,
        news.length,
        gallery.length,
        behindTheScenes.length,
        videos.length,
        wallpaper.length,
        awards.length,
    ]);
    const firstEnabled = tabs.find((t) => t.enabled)?.id ?? "synopsis";
    const [activeTab, setActiveTab] = useState(firstEnabled);
    const [wallpaperType, setWallpaperType] = useState("desktop");
    const [showAllCast, setShowAllCast] = useState(false);
    const [openVideoId, setOpenVideoId] = useState(null);
    const [openLightbox, setOpenLightbox] = useState(null);
    const [openAward, setOpenAward] = useState(0);
    const [showBackToTop, setShowBackToTop] = useState(false);
    useEffect(() => {
        function onScroll() {
            setShowBackToTop(window.scrollY > 500);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        const cur = tabs.find((t) => t.id === activeTab);
        if (cur && !cur.enabled) {
            setActiveTab(tabs.find((t) => t.enabled)?.id ?? "synopsis");
        }
    }, [tabs, activeTab]);
    useEffect(() => {
        if (!openVideoId && !openLightbox)
            return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                setOpenVideoId(null);
                setOpenLightbox(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [openVideoId, openLightbox]);
    const trailerImage = resolveUploadUrl(movie.theatricalTrailerImage) ||
        youtubeThumb(movie.theatricalTrailerUrl) ||
        resolveUploadUrl(movie.bigImage);
    const backgroundImage = resolveUploadUrl(movie.backgroundImage);
    const cutImage = resolveUploadUrl(movie.cutImage);
    const cutImage2 = resolveUploadUrl(movie.cutImage2);
    const desktopWallpapers = wallpaper.filter((w) => (w.type || "").toLowerCase() === "desktop");
    const mobileWallpapers = wallpaper.filter((w) => (w.type || "").toLowerCase() === "mobile");
    const videosMoreHref = movie.urlName != null && String(movie.urlName).trim() !== "" ?
        `/videos/${encodeURIComponent(String(movie.urlName))}`
    : "/videos";
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "movie-inside-bg", style: backgroundImage
                    ? {
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: "cover, cover",
                        backgroundPosition: "top center, top center",
                        backgroundRepeat: "no-repeat, no-repeat",
                    }
                    : undefined, children: [_jsxs("div", { className: "container-fluid pd4", children: [_jsx("div", { className: "movie-inside-curve", id: "top-scroll" }), _jsxs("div", { className: "movie-inner-bg", children: [_jsx("div", { className: "row g-0", children: _jsx("div", { className: "col-12", children: _jsx("div", { className: "movie-inside-date", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "m-title", children: _jsx("h1", { className: "color-primary font-hammersmith text-up", children: "Theatrical Trailer" }) }), _jsx("div", { className: "movie-trailor dh-relative", children: trailerImage ? (movie.theatricalTrailerUrl ? (_jsxs("button", { type: "button", className: "movie-trailor-btn", onClick: () => setOpenVideoId(movie.theatricalTrailerUrl ?? null), "aria-label": "Play theatrical trailer", children: [_jsx("img", { src: trailerImage, alt: movie.name || "Dharma Productions", className: "img-responsive margin-auto width100" }), _jsx("div", { className: "dh-absulate middle", children: _jsx("img", { src: "/frontend/img/play-movie.png", alt: "", className: "movie-trailor-play-img" }) })] })) : (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            _jsx("img", { src: trailerImage, alt: movie.name || "Dharma Productions", className: "img-responsive margin-auto width100" }))) : null })] }) }) }) }), _jsxs("div", { className: "movie-tabs", children: [_jsx("div", { className: "all-tabs d-none d-md-block", children: _jsx("div", { className: "btn-group", role: "group", "aria-label": "Movie tabs", children: tabs.map((t) => (_jsx("button", { type: "button", className: `btn movie-inside-tab-btn ${activeTab === t.id ? "active-list" : ""} ${t.enabled ? "" : "my-disable"}`, disabled: !t.enabled, onClick: () => t.enabled && setActiveTab(t.id), children: t.label }, t.id))) }) }), _jsx("div", { className: "mob-slider d-md-none vs-dis", children: _jsx("div", { className: "all-tabs", children: _jsx("div", { className: "btn-group movie-inside-tabs-mob flex-nowrap", role: "group", "aria-label": "Movie tabs", children: tabs.map((t) => (_jsx("button", { type: "button", className: `btn movie-inside-tab-btn ${activeTab === t.id ? "active-list" : ""} ${t.enabled ? "" : "my-disable"}`, disabled: !t.enabled, onClick: () => t.enabled && setActiveTab(t.id), children: t.label }, `m-${t.id}`))) }) }) }), activeTab === "synopsis" ? (_jsx("div", { className: "synopsis", children: _jsx("div", { className: "movie-inside-date bg-synopsis mob-bg", style: cutImage2
                                                        ? {
                                                            background: `url(${cutImage2}) no-repeat`,
                                                            backgroundSize: "contain",
                                                            backgroundPosition: "right bottom",
                                                            paddingTop: 20,
                                                            paddingBottom: 30,
                                                        }
                                                        : undefined, children: _jsx("div", { className: "row", children: _jsx("div", { className: "col-md-8", children: _jsxs("div", { className: "data-content synopsis-pane", children: [_jsx("div", { className: "synopsis-body", dangerouslySetInnerHTML: {
                                                                            __html: movie.synopsis || "",
                                                                        } }), movie.note && movie.note.trim().length > 0 ? (_jsxs(_Fragment, { children: [_jsx("h4", { className: "mt30", children: "DIRECTOR'S NOTE:" }), _jsx("p", { children: movie.note })] })) : null] }) }) }) }) })) : null, activeTab === "cast" ? (_jsx("div", { children: _jsxs("div", { className: "movie-inside-date bg-cast cast-credit mob-bg", style: cutImage
                                                        ? {
                                                            background: `url(${cutImage}) no-repeat`,
                                                            backgroundSize: "contain",
                                                            backgroundPosition: "right bottom",
                                                            paddingTop: 20,
                                                            paddingBottom: 30,
                                                        }
                                                        : undefined, children: [_jsx("div", { className: "box-pad", children: _jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-2 col-sm-2 col-12", children: _jsx("div", { className: "cast cast-mob", children: _jsx("h1", { className: "font-hammersmith color-black", children: "CAST" }) }) }), _jsxs("div", { className: "col-md-8 col-sm-8 col-12", children: [_jsx("div", { className: "row", children: mainCast.map((item, idx) => (_jsx("div", { className: "col-md-3 col-sm-6 col-12 movie-col", children: _jsxs("div", { className: "all-cast text-center", children: [_jsx("div", { className: "cast-box", children: _jsx("img", { src: resolveUploadUrl(item.image) ||
                                                                                                        "/frontend/img/logo.png", alt: item.actor || "Dharma Productions", className: "img-responsive" }) }), _jsx("div", { className: "cast-name mt18", children: _jsx("span", { className: "color-dark text-cap", children: item.actor }) }), _jsx("div", { className: "role-name", children: _jsx("span", { className: "color-primary text-up font-bold f18", children: item.name }) })] }) }, `cast-${idx}`))) }), showAllCast && subCast.length > 0 ? (_jsx("div", { className: "row mt30", children: _jsx("div", { className: "other-cast", children: _jsx("ul", { className: "margin0", children: subCast.map((item, i) => (_jsx("li", { children: _jsxs("div", { className: "first-cast", children: [_jsx("span", { className: "color-dark f18 text-cap", children: item.actor }), _jsx("br", {}), _jsx("span", { className: "color-primary text-up font-bold", children: item.name })] }) }, `sub-${i}`))) }) }) })) : null, subCast.length > 0 ? (_jsx("div", { className: "text-center mt60", children: _jsx("div", { className: "btn-view-more", children: _jsxs("button", { type: "button", className: "btn-1 font-hammersmith btn color-primary display-inline", onClick: () => setShowAllCast((v) => !v), children: [_jsx("svg", { "aria-hidden": "true", focusable: "false", children: _jsx("rect", { x: "0", y: "0", fill: "none", width: "100%", height: "100%" }) }), showAllCast ? "HIDE ALL" : "VIEW ALL"] }) }) })) : null] }), _jsx("div", { className: "col-md-2 col-sm-2 d-none d-sm-block", children: _jsx(SocialShare, {}) })] }) }), crew.length > 0 ? (_jsx("div", { className: "pt50", children: _jsx("div", { className: "row", children: _jsxs("div", { className: "bg-bottom-right", children: [_jsx("div", { className: "col-md-2 col-sm-2 col-12", children: _jsx("div", { className: "cast cast-mob", children: _jsx("h1", { className: "font-hammersmith color-black margin0", children: "CREW" }) }) }), _jsx("div", { className: "col-md-10 col-sm-10 col-12", children: groupCrewIntoColumns(crew).map((row, ri) => (_jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-5 col-sm-6 col-6", children: _jsx("div", { className: "all-cast", children: _jsx("ul", { className: "padding0", children: _jsx("li", { children: row.left.title }) }) }) }), _jsx("div", { className: "col-md-5 col-sm-6 col-6", children: _jsx("div", { className: "all-cast", children: _jsx("ul", { className: "padding0", children: _jsxs("li", { children: ["... ", row.left.name] }) }) }) }), row.right ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "col-md-5 col-sm-6 col-6", children: _jsx("div", { className: "all-cast", children: _jsx("ul", { className: "padding0", children: _jsx("li", { children: row.right.title }) }) }) }), _jsx("div", { className: "col-md-5 col-sm-6 col-6", children: _jsx("div", { className: "all-cast", children: _jsx("ul", { className: "padding0", children: _jsxs("li", { children: ["... ", row.right.name] }) }) }) })] })) : null] }, `crew-row-${ri}`))) })] }) }) })) : null] }) })) : null, activeTab === "news" ? (_jsx("div", { className: "news", children: _jsx("div", { className: "movie-inside-date bg-cast cast-credit", style: cutImage
                                                        ? {
                                                            background: `url(${cutImage}) no-repeat`,
                                                            backgroundSize: "contain",
                                                            backgroundPosition: "right bottom",
                                                            paddingTop: 20,
                                                            paddingBottom: 30,
                                                        }
                                                        : undefined, children: _jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-11 col-sm-10 col-12", children: _jsx("div", { className: "all-movies movie-news-grid movie-news-grid--animated", children: news.map((item, i) => {
                                                                                const thumb = resolveUploadUrl(item.image) || resolveUploadUrl(item.banner) || "";
                                                                                return _jsx(Link, { href: `/news-events/${String(item._id)}`, className: "masonry-brick masonry-link movie-news-card text-decoration-none text-reset", children: _jsxs("div", { className: "masonry-box padd20", children: [thumb ? (_jsxs("div", { className: "img-animates dh-relative", children: [_jsx("img", { src: thumb, alt: item.title || "Dharma Production", className: "img-responsive width100 img-hv" }), _jsxs("div", { className: "overlay dh-absulate", children: [_jsx("div", { className: "pos-middle", children: _jsx("span", { className: "color-white font-hammersmith", children: shorten(item.title || "Read article", 72) }) }), _jsx("div", { className: "bottom-right dh-absulate ply-post", children: _jsx("span", { className: "movie-trailor-play movie-trailor-play--sm", "aria-hidden": "true", children: "\u2197" }) })] })] })) : null, _jsx("div", { className: "news-title mt10", children: _jsx("h4", { className: "margin0 color-black font-karla", children: shorten(item.title || "", 50) }) }), _jsx("div", { className: "news-date", children: _jsx("span", { className: "color-black f12 font-karla", children: formatNewsDate(item.date) }) })] }) }, `news-${i}`); }) }) }), _jsx("div", { className: "col-md-1 col-sm-2 d-none d-sm-block", children: _jsx(SocialShare, {}) })] }) }) })) : null, activeTab === "gallery" ? _jsx(MovieInsideImageMasonryPane, { cutImage, items: gallery, idPrefix: "gal", onImageClick: setOpenLightbox }) : null, activeTab === "scene" ? _jsx(MovieInsideImageMasonryPane, { cutImage, items: behindTheScenes, idPrefix: "bts", onImageClick: setOpenLightbox }) : null, activeTab === "video" ? (_jsx("div", { className: "video", children: _jsx("div", { className: "movie-inside-date bg-cast cast-credit", style: cutImage
                                                        ? {
                                                            background: `url(${cutImage}) no-repeat`,
                                                            backgroundSize: "contain",
                                                            backgroundPosition: "right bottom",
                                                            paddingTop: 20,
                                                            paddingBottom: 30,
                                                        }
                                                        : undefined, children: _jsxs(_Fragment, { children: [_jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-11 col-sm-10 col-12", children: _jsx("div", { className: "row", children: videos.map((item, i) => (_jsx("div", { className: "col-md-4 col-sm-4 col-12 pad5", children: _jsx("div", { className: "video-play-box dh-relative", children: _jsx("button", { type: "button", className: "video-play-btn", onClick: () => setOpenVideoId(item.url || null), "aria-label": item.name || "Play video", children: _jsxs("div", { className: "img-animates", children: [_jsx("img", { src: resolveUploadUrl(item.thumbnail) ||
                                                                                                youtubeThumb(item.url) ||
                                                                                                "", alt: item.name || "Dharma Productions", className: "img-responsive width100 img-hv" }), _jsxs("div", { className: "overlay dh-absulate", children: [_jsx("div", { className: "pos-middle", children: _jsx("span", { className: "color-white font-hammersmith", children: item.name }) }), _jsx("div", { className: "bottom-right dh-absulate ply-post", children: _jsx("span", { className: "movie-trailor-play movie-trailor-play--sm", "aria-hidden": "true", children: "\u25B6" }) })] })] }) }) }) }, `vid-${i}`))) }) }), _jsx("div", { className: "col-md-1 col-sm-2 d-none d-sm-block", children: _jsx(SocialShare, {}) })] }), _jsx("div", { className: "text-center mt30", children: _jsx("div", { className: "btn-outline", children: _jsx(Link, { href: videosMoreHref, className: "btn-primary-outline font-hammersmith btn-enter text-decoration-none d-inline-block", "aria-label": "View all videos for this movie", children: "VIEW MORE" }) }) })] }) }) })) : null, activeTab === "wallpapper" ? (_jsx("div", { className: "wallpapper", children: _jsxs("div", { className: "movie-inside-date bg-cast cast-credit", style: cutImage
                                                        ? {
                                                            background: `url(${cutImage}) no-repeat`,
                                                            backgroundSize: "contain",
                                                            backgroundPosition: "right bottom",
                                                            paddingTop: 20,
                                                            paddingBottom: 30,
                                                        }
                                                        : undefined, children: [_jsx("div", { className: "row", children: _jsx("div", { className: "col-12", children: _jsxs("div", { className: "btn-group custom-tabs", role: "group", "aria-label": "Wallpaper type", children: [_jsx("button", { type: "button", className: `btn font-hammersmith f18 ${wallpaperType === "desktop" ? "active-list" : ""}`, onClick: () => setWallpaperType("desktop"), children: "Desktop" }), _jsx("button", { type: "button", className: `btn font-hammersmith f18 ${wallpaperType === "mobile" ? "active-list" : ""}`, onClick: () => setWallpaperType("mobile"), children: "Mobile" })] }) }) }), _jsx("div", { className: "desktop mt15", children: _jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-11 col-sm-10 col-12", children: _jsx("div", { className: "row", children: (wallpaperType === "desktop"
                                                                                ? desktopWallpapers
                                                                                : mobileWallpapers).map((item, i) => item.image ? (_jsx("div", { className: `pad5 col-12 ${wallpaperType === "desktop"
                                                                                    ? "col-md-4 col-sm-6"
                                                                                    : "col-md-3 col-sm-3"}`, children: _jsx("div", { className: "all-wall", children: _jsxs("div", { className: `desktop dh-relative ${wallpaperType === "mobile"
                                                                                            ? "mob-height"
                                                                                            : ""}`, children: [_jsx("img", { src: resolveUploadUrl(item.image, {
                                                                                                    width: 400,
                                                                                                }), alt: "Dharma productions", className: "img-responsive width100" }), _jsx("div", { className: "download dh-absulate", children: _jsx("a", { href: resolveUploadUrl(item.image), download: true, "aria-label": "Download wallpaper", children: _jsx("span", { className: "download-icon", children: "\u2B07" }) }) })] }) }) }, `wall-${i}`)) : null) }) }), _jsx("div", { className: "col-md-1 col-sm-2 d-none d-sm-block", children: _jsx(SocialShare, {}) })] }) })] }) })) : null, activeTab === "awards" ? (_jsx("div", { className: "awards", children: _jsx("div", { className: "movie-inside-date bg-cast cast-credit", style: cutImage
                                                        ? {
                                                            background: `url(${cutImage}) no-repeat`,
                                                            backgroundSize: "contain",
                                                            backgroundPosition: "right bottom",
                                                            paddingTop: 20,
                                                            paddingBottom: 30,
                                                        }
                                                        : undefined, children: _jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-11 col-sm-10 col-12", children: _jsx("div", { className: "movie-award", children: awards.map((data, i) => {
                                                                        const isOpen = openAward === i;
                                                                        return (_jsxs("div", { className: "award-panel", children: [_jsx("button", { type: "button", className: "award-heading mob-font", onClick: () => setOpenAward(isOpen ? null : i), "aria-expanded": isOpen, children: _jsxs("div", { className: "row align-items-center", children: [_jsx("div", { className: "col-md-7 col-sm-6 col-7", children: _jsx("h3", { className: "dark-black text-up font-karla font-bold margin0", children: data.name }) }), _jsx("div", { className: "col-md-4 col-sm-5 col-3", children: _jsx("h3", { className: "dark-black text-up font-karla font-bold margin0", children: data.year }) }), _jsx("div", { className: "col-md-1 col-sm-1 col-2", children: _jsx("span", { className: "award-toggle pull-right", children: isOpen ? "−" : "+" }) })] }) }), isOpen ? (_jsx("div", { className: "award-body", children: _jsxs("div", { className: "row", children: [_jsx("div", { className: "title-acc", children: _jsx("h1", { className: "font-karla color-primary pl10", children: "Won" }) }), (data.award || []).map((row, j) => (_jsxs("div", { className: "row", children: [_jsx("div", { className: "col-md-7 col-sm-7 col-6", children: _jsx("div", { className: "awards-name", children: _jsx("ul", { className: "padding0 list-none color-black", children: _jsx("li", { children: _jsx("span", { children: row.awardname }) }) }) }) }), _jsx("div", { className: "col-md-4 col-sm-4 col-6", children: _jsx("div", { className: "awards-name", children: _jsx("ul", { className: "padding0 list-none color-primary", children: _jsxs("li", { children: [_jsx("span", { children: row.winner }), row.note ? (_jsx("p", { className: "color-black f12 line0", children: row.note })) : null] }) }) }) })] }, `award-row-${j}`)))] }) })) : null] }, `award-${i}`));
                                                                    }) }) }), _jsx("div", { className: "col-md-1 col-sm-2 d-none d-sm-block", children: _jsx(SocialShare, {}) })] }) }) })) : null] })] })] }), related.length > 0 ? (_jsx("div", { className: "related-m", children: _jsxs("div", { className: "bg-screen mobile-row", children: [_jsx("h1", { className: "color-white font-hammersmith text-up line45 margin0 ml15 f55", style: { lineHeight: "35%" }, children: "Related Movies" }), _jsx("div", { className: "row-flex text-center justify-content-center flex-wrap mt20", children: related.slice(0, 12).map((item) => {
                                        const img = resolveUploadUrl(item.recentSmall) ||
                                            resolveUploadUrl(item.smallImage) ||
                                            resolveUploadUrl(item.upcomingSmall);
                                        const card = (_jsx("div", { className: "img-pads", children: img ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            _jsx("img", { src: img, alt: item.name || "Dharma Productions", className: "img-responsive width100" })) : null }));
                                        return (_jsx("div", { className: "col-flex", children: item.status && item.urlName ? (_jsx(Link, { href: `/movie/${encodeURIComponent(item.urlName)}`, className: "text-decoration-none", children: card })) : (card) }, item._id));
                                    }) })] }) })) : null] }), showBackToTop ? (_jsx("button", { type: "button", className: "back-to-top show", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }), "aria-label": "Scroll to top", children: _jsx("img", { src: "/frontend/img/top-scroll.png", alt: "" }) })) : null, openVideoId ? (_jsx("div", { className: "dh-modal-backdrop", onClick: () => setOpenVideoId(null), role: "presentation", children: _jsxs("div", { className: "dh-modal-frame", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", children: [_jsx("button", { type: "button", className: "dh-modal-close", onClick: () => setOpenVideoId(null), "aria-label": "Close", children: "\u00D7" }), _jsx("iframe", { src: youtubeEmbed(openVideoId), title: "Trailer", frameBorder: 0, allow: "autoplay; encrypted-media; picture-in-picture", allowFullScreen: true })] }) })) : null, openLightbox ? (_jsx("div", { className: "dh-modal-backdrop", onClick: () => setOpenLightbox(null), role: "presentation", children: _jsxs("div", { className: "dh-modal-image-frame", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", children: [_jsx("button", { type: "button", className: "dh-modal-close", onClick: () => setOpenLightbox(null), "aria-label": "Close", children: "\u00D7" }), _jsx("img", { src: openLightbox, alt: "Gallery preview" })] }) })) : null] }));
}
function SocialShare() {
    // Plain SSR-safe wrapper — actual share URL is hydrated on click using
    // window.location to avoid leaking a server-rendered (possibly stale) URL.
    return (_jsxs("div", { className: "social-share pull-right", children: [_jsx("span", { className: "font-karla font-bold color-light-grey f18", children: "share" }), _jsxs("ul", { className: "padding0", children: [_jsx("li", { children: _jsx("a", { href: "#", target: "_blank", rel: "noopener noreferrer", onClick: (e) => {
                                e.preventDefault();
                                if (typeof window !== "undefined") {
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
                                }
                            }, "aria-label": "Share on Facebook", children: _jsx("i", { className: "fa-brands fa-facebook-f" }) }) }), _jsx("li", { children: _jsx("a", { href: "#", target: "_blank", rel: "noopener noreferrer", onClick: (e) => {
                                e.preventDefault();
                                if (typeof window !== "undefined") {
                                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, "_blank");
                                }
                            }, "aria-label": "Share on Twitter", children: _jsx("i", { className: "fa-brands fa-twitter" }) }) })] })] }));
}
