"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveUploadUrl } from "@/lib/media";
import { movieSearchThumbnail, movieSlug } from "@/lib/moviesLayout";
const FALLBACK_POSTER = "/frontend/img/logo.png";
const LIST_CAP = 200;
export function MovieSearchCombobox({ movies, onSelect, parentSearchBanner, onClearBanner, initialInputValue = "", }) {
    const [query, setQuery] = useState(initialInputValue);
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const listId = "movies-search-listbox";
    useEffect(() => {
        setQuery(initialInputValue || "");
    }, [initialInputValue]);
    useEffect(() => {
        if (!parentSearchBanner)
            setQuery("");
    }, [parentSearchBanner]);
    const sortedSource = useMemo(() => {
        return [...movies].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    }, [movies]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return sortedSource.slice(0, LIST_CAP);
        return sortedSource
            .filter((m) => (m.name || "").toLowerCase().includes(q))
            .slice(0, LIST_CAP);
    }, [sortedSource, query]);
    useEffect(() => {
        setHighlighted(0);
    }, [query, open]);
    useEffect(() => {
        if (!open || !listRef.current)
            return;
        const node = listRef.current.querySelector(`[data-movies-search-index="${highlighted}"]`);
        node?.scrollIntoView({ block: "nearest" });
    }, [highlighted, open]);
    const close = useCallback(() => setOpen(false), []);
    useEffect(() => {
        if (!open)
            return;
        const onDoc = (e) => {
            const el = containerRef.current;
            if (el && !el.contains(e.target))
                close();
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open, close]);
    const pick = useCallback((m) => {
        setQuery("");
        setOpen(false);
        onSelect(m);
    }, [onSelect]);
    const onKeyDown = (e) => {
        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && filtered.length) {
            setOpen(true);
            return;
        }
        if (!filtered.length) {
            if (e.key === "Escape")
                close();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((i) => Math.max(i - 1, 0));
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            const m = filtered[highlighted];
            if (m)
                pick(m);
        }
        else if (e.key === "Escape") {
            e.preventDefault();
            close();
            inputRef.current?.blur();
        }
    };
    const showList = open && filtered.length > 0;
    return (_jsxs("div", { ref: containerRef, className: "movies-search-combobox text-start", children: [_jsxs("div", { className: `movies-search-field dh-relative${parentSearchBanner ? " movies-search-field--has-clear" : ""}`, children: [_jsx("label", { htmlFor: "movies-search-input", className: "visually-hidden", children: "Search for a Movie" }), _jsxs("div", { className: "movies-search-input-inner dh-relative", children: [_jsx("img", { src: "/frontend/img/search-grey.png", alt: "", className: "movies-search-input-icon", width: 22, height: 22 }), _jsx("input", { ref: inputRef, id: "movies-search-input", type: "search", autoComplete: "off", role: "combobox", "aria-expanded": showList, "aria-controls": listId, "aria-autocomplete": "list", className: "movies-search-input form-control shadow-none", placeholder: "Search for a Movie", value: query, onChange: (e) => {
                                    setQuery(e.target.value);
                                    setOpen(true);
                                }, onFocus: () => setOpen(true), onKeyDown: onKeyDown })] }), parentSearchBanner && onClearBanner ?
                        _jsx("button", { type: "button", className: "movies-search-clear btn btn-link p-0 border-0 bg-transparent", "aria-label": "Clear search", onMouseDown: (e) => e.preventDefault(), onClick: () => {
                                onClearBanner();
                                setQuery("");
                                close();
                            }, children: _jsx("img", { src: "/frontend/img/error-2.png", alt: "", width: 24, height: 24 }) })
                        : null] }), showList ?
                _jsx("ul", { ref: listRef, id: listId, role: "listbox", className: "movies-search-dropdown", children: filtered.map((m, i) => {
                        const slug = movieSlug(m);
                        const thumb = resolveUploadUrl(movieSearchThumbnail(m)) || FALLBACK_POSTER;
                        const label = `${m.name || ""}${m.year ? ` (${m.year})` : ""}`;
                        const active = i === highlighted;
                        return (_jsxs("li", { "data-movies-search-index": i, role: "option", "aria-selected": active, className: `movies-search-option ${active ? "is-highlighted" : ""}`, onMouseEnter: () => setHighlighted(i), onMouseDown: (e) => e.preventDefault(), onClick: () => pick(m), children: [_jsx("img", { src: thumb, alt: "", className: "movies-search-thumb" }), _jsx("span", { className: "movies-search-option-label", children: label })] }, slug || String(m._id)));
                    }) })
                : null] }));
}
