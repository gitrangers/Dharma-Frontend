"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { name: "Overview", href: "/overview" },
  { name: "Movies", href: "/movies" },
  { name: "Videos", href: "/videos" },
  {
    name: "Social",
    href: "/social",
    subnav: [
      { name: "Fan Corner", href: "/fan-landing" },
    ],
  },
  { name: "News & Events", href: "/news-events" },
  { name: "Contact Us", href: "/contact-us" },
];

/** Legacy `frontend/views/header.html` — same URLs and icon order as dharmanodeRun */
const headerIconLinks = [
  { href: "https://www.facebook.com/DharmaMovies/?fref=ts", icon: "fa-brands fa-facebook-f", label: "Facebook" },
  { href: "https://twitter.com/DharmaMovies", icon: "fa-brands fa-twitter", label: "Twitter" },
  { href: "https://www.instagram.com/dharmamovies/?hl=en", icon: "fa-brands fa-instagram", label: "Instagram" },
  { href: "https://www.youtube.com/c/dharmamovies", icon: "fa-brands fa-youtube", label: "YouTube" },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [socialDeskOpen, setSocialDeskOpen] = useState(false);
  /** Matches legacy `menu.html` ng-click showSub(menu) — one open submenu key at a time. */
  const [openMobSubKey, setOpenMobSubKey] = useState(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSocialDeskOpen(false);
    setOpenMobSubKey(null);
  }, [pathname]);

  function submitHeaderSearch(e) {
    e.preventDefault();
    const t = q.trim();
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(t ? `/movies?q=${encodeURIComponent(t)}` : "/movies");
  }

  /** @param {{ includeSearch?: boolean; onSocialLinkClick?: () => void }} [opts] */
  function renderHeaderIconList(extraClass = "", opts = {}) {
    const includeSearch = opts.includeSearch !== false;
    const { onSocialLinkClick } = opts;
    return (
      <ul className={`dh-header-social-ul padding0 margin0 mb-0 ${extraClass}`.trim()}>
        {headerIconLinks.map((s) => (
          <li key={s.href}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              onClick={(e) => {
                e.stopPropagation();
                if (onSocialLinkClick) onSocialLinkClick();
              }}
            >
              <i className={s.icon} />
            </a>
          </li>
        ))}
        {includeSearch ?
          <li>
            <button
              type="button"
              className="my-main-btn"
              aria-label="Search movies"
              onClick={() => {
                setSearchOpen((v) => !v);
                setMenuOpen(false);
              }}
            >
              <Image src="/frontend/img/search-light.png" alt="" width={18} height={18} className="w15" />
            </button>
          </li>
        : null}
      </ul>
    );
  }

  return (
    <header className="home">
      <nav className="navbar navbar-expand-md navbar-dark fixed-top border-0 dh-site-navbar">
        <div className="container-fluid mob-pad0 px-0 dh-header-shell">
          <div className="head-bg dh-relative">
            <div className="container dh-header-inner">
              <div className="row align-items-center g-0 dh-header-main-row">
                <div className="col-12 col-md-2 text-center px-0 px-md-2 dh-header-logo-col">
                  <div className="d-md-none dh-header-mob-top w-100">
                    {/* Legacy BS3 navbar-header: logo + toggler (`frontend/views/header.html`) */}
                    {/* Mobile: centered mark + right hamburger (`minmax + auto + minmax`) — parity with branded mobile shell */}
                    <div className="dh-header-mob-bar dh-header-mob-bar--triple dh-navbar-header w-100">
                      <span className="dh-header-mob-sym-slot" aria-hidden />
                      <Link
                        className="d-inline-block dh-header-mob-brand dh-header-mob-brand--centered"
                        href="/"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Image
                          src="/frontend/img/logo.png"
                          alt="Dharma Productions"
                          width={168}
                          height={44}
                          className="img-fluid dh-header-logo logo-img"
                          priority
                        />
                      </Link>
                      <button
                        type="button"
                        className="navbar-toggler collapsed border-0 shadow-none dh-header-toggler dh-header-mob-toggle"
                        aria-label="Toggle navigation"
                        aria-controls="nav-collapse"
                        aria-expanded={menuOpen}
                        onClick={() => {
                          setMenuOpen((v) => !v);
                          setSocialDeskOpen(false);
                        }}
                      >
                        <span className="navbar-toggler-icon" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="d-none d-md-flex align-items-center justify-content-md-center gap-2 w-100">
                    <Link className="d-inline-block" href="/" onClick={() => setMenuOpen(false)}>
                      <Image
                        src="/frontend/img/logo.png"
                        alt="Dharma Productions"
                        width={168}
                        height={44}
                        className="img-fluid dh-header-logo"
                        priority
                      />
                    </Link>
                  </div>
                </div>
                <div className="col-12 col-md-8">
                  <div className="collapse navbar-collapse text-center d-md-block" id="nav-collapse-main">
                    <div className="template menu d-none d-md-inline-block text-start text-md-center w-100">
                      <ul className="nav navbar-nav mt18 custom-menu dh-header-nav-list mb-0 d-flex flex-column flex-md-row align-items-md-center justify-content-md-center">
                        {links.map((item) =>
                          item.subnav?.length ?
                            <li
                              key={item.href}
                              className="nav-item dropdown dh-header-nav-dd position-relative"
                              onMouseEnter={() => setSocialDeskOpen(true)}
                              onMouseLeave={() => setSocialDeskOpen(false)}
                            >
                              <Link
                                className="nav-link text-up color-white font-hammersmith dh-header-nav-link d-inline-flex align-items-center gap-1"
                                href={item.href}
                              >
                                {item.name}
                                <i className="fa-solid fa-angle-down small opacity-90" aria-hidden />
                              </Link>
                              <ul className={`dropdown-menu dh-header-dropdown shadow-sm ${socialDeskOpen ? "show" : ""}`}>
                                {item.subnav.map((sub) => (
                                  <li key={sub.href}>
                                    <Link className="dropdown-item" href={sub.href}>
                                      {sub.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          : <li key={item.href} className="nav-item">
                              <Link
                                className="nav-link text-up color-white font-hammersmith dh-header-nav-link"
                                href={item.href}
                              >
                                {item.name}
                              </Link>
                            </li>,
                        )}
                        <li className="nav-item">
                          <a
                            className="nav-link text-up color-white font-hammersmith dh-header-nav-link"
                            href="https://dharma2pointo.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            2.0
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-2 d-none d-md-block main-pad0 text-end">
                  <div className="head-social dh-list pull-right mt15 m24-mob fl-main">{renderHeaderIconList()}</div>
                </div>
              </div>
            </div>
            {menuOpen ?
              <div className="d-md-none dh-header-mob-drawer text-center" id="nav-collapse">
                <ul className="nav navbar-nav mt18 custom-menu list-unstyled mb-0 w-100">
                  {links.map((item) =>
                    item.subnav?.length ?
                      <li key={item.href} className="nav-item dh-relative">
                        <div className="d-flex align-items-stretch w-100 dh-mob-nav-split">
                          <Link
                            className="nav-link text-up color-white font-hammersmith dh-header-nav-link dh-relative flex-grow-1 text-center"
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            className="nav-link text-up color-white font-hammersmith dh-header-nav-link dh-mob-sub-toggle-btn border-0 bg-transparent flex-shrink-0"
                            aria-expanded={openMobSubKey === item.href}
                            aria-controls={`mob-sub-${item.href.replace(/\W/g, "")}`}
                            aria-label={`${item.name} submenu`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMobSubKey((k) => (k === item.href ? null : item.href));
                            }}
                          >
                            <i className="fa-solid fa-angle-down" aria-hidden />
                          </button>
                        </div>
                        {openMobSubKey === item.href ?
                          <ul className="list-none mob-mn padding0" id={`mob-sub-${item.href.replace(/\W/g, "")}`}>
                            {item.subnav.map((sub) => (
                              <li key={sub.href} className="min-f-tp">
                                <Link
                                  className="nav-link text-up color-white dh-mob-submenu-link text-center"
                                  href={sub.href}
                                  onClick={() => setMenuOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        : null}
                      </li>
                    : <li key={`mob-${item.href}`} className="nav-item dh-relative">
                        <Link
                          className="nav-link text-up color-white font-hammersmith dh-header-nav-link dh-relative"
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </li>,
                  )}
                  <li className="nav-item dh-relative">
                    <a
                      className="nav-link text-up color-white font-hammersmith dh-header-nav-link dh-relative"
                      href="https://dharma2pointo.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      2.0
                    </a>
                  </li>
                </ul>
                <div className="dh-header-mob-external-social w-100">
                  <div className="head-social dh-list w-100 d-flex justify-content-end mt15 pb-1 pe-2">
                    {renderHeaderIconList("", {
                      includeSearch: false,
                      onSocialLinkClick: () => setMenuOpen(false),
                    })}
                  </div>
                </div>
              </div>
            : null}
          </div>
          <div className="head-curve" aria-hidden="true" />
          {searchOpen ?
            <div className="search-movie search-movie-mar my-search site-header-search">
              <div className="movie-search-pg dh-relative dh-header-search-field-wrap">
                <div className="search-img">
                  <Image src="/frontend/img/search-grey.png" alt="" width={22} height={22} />
                </div>
                <form onSubmit={submitHeaderSearch}>
                  <input
                    type="search"
                    className="form-control search-in rounded-0"
                    placeholder="Search for movie"
                    name="q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    autoComplete="off"
                    aria-label="Search for movie"
                  />
                </form>
              </div>
              <button
                type="button"
                className="search-img2 border-0 bg-transparent p-0"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <Image src="/frontend/img/error-2.png" alt="" width={24} height={24} />
              </button>
            </div>
          : null}
        </div>
      </nav>
    </header>
  );
}
