"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { name: "Overview", href: "/overview" },
  { name: "Movies", href: "/movies" },
  { name: "Videos", href: "/videos" },
  { name: "Social", href: "/social" },
  { name: "News & Events", href: "/news-events" },
  { name: "Contact Us", href: "/contact-us" },
];

/** Legacy localhost:1337 header — Facebook + Twitter + Instagram + YouTube, then search */
const headerIconLinks = [
  { href: "https://www.facebook.com/DharmaMovies/?fref=ts", icon: "fa-brands fa-facebook-f", label: "Facebook" },
  { href: "https://twitter.com/DharmaMovies", icon: "fa-brands fa-twitter", label: "Twitter" },
  { href: "https://www.instagram.com/dharmamovies/?hl=en", icon: "fa-brands fa-instagram", label: "Instagram" },
  { href: "https://www.youtube.com/c/dharmamovies", icon: "fa-brands fa-youtube", label: "YouTube" },
];

export function SiteHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  function submitHeaderSearch(e) {
    e.preventDefault();
    const t = q.trim();
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(t ? `/movies?q=${encodeURIComponent(t)}` : "/movies");
  }

  function renderHeaderIconList(extraClass = "") {
    return (
      <ul className={`dh-header-social-ul padding0 margin0 mb-0 ${extraClass}`.trim()}>
        {headerIconLinks.map((s) => (
          <li key={s.href}>
            <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
              <i className={s.icon} />
            </a>
          </li>
        ))}
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
      </ul>
    );
  }

  return (
    <header className="home">
      <nav className="navbar navbar-expand-md navbar-dark fixed-top border-0 dh-site-navbar">
        <div className="container-fluid mob-pad0 px-0 dh-header-shell">
          <div className="head-bg dh-relative">
            <div className="container dh-header-inner">
              <div className="dh-header-main-row">
                <div className="dh-header-logo-col">
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
                  <button
                    type="button"
                    className="navbar-toggler d-md-none border-0 shadow-none px-2 dh-header-toggler"
                    aria-label="Toggle navigation"
                    aria-controls="nav-collapse"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <span className="navbar-toggler-icon" />
                  </button>
                </div>
                <div className="d-none d-md-flex align-items-center min-w-0 dh-header-nav-wrap">
                  <ul className="nav navbar-nav mt18 custom-menu dh-header-nav-list mb-0 d-flex flex-row align-items-center">
                    {links.map((item) => (
                      <li key={item.href} className="nav-item">
                        <Link className="nav-link text-up color-white font-hammersmith dh-header-nav-link" href={item.href}>
                          {item.name}
                        </Link>
                      </li>
                    ))}
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
                <div className="d-none d-md-flex align-items-center dh-header-social-col main-pad0">
                  <div className="head-social dh-list float-md-end mt15">{renderHeaderIconList()}</div>
                </div>
              </div>
              {searchOpen ?
                <div className="search-movie search-movie-mar my-search site-header-search">
                  <div className="search-img d-none d-sm-block">
                    <Image src="/frontend/img/search-grey.png" alt="" width={22} height={22} />
                  </div>
                  <form className="movie-search-pg flex-grow-1" onSubmit={submitHeaderSearch}>
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
              {menuOpen ?
                <div className="d-md-none border-top border-white border-opacity-25 dh-header-mob-drawer" id="nav-collapse">
                  <ul className="nav navbar-nav list-unstyled mb-0 py-3 px-2">
                    {links.map((item) => (
                      <li key={`mob-${item.href}`} className="nav-item mb-2">
                        <Link
                          className="nav-link text-up color-white font-hammersmith dh-header-nav-link"
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                    <li className="nav-item mb-2">
                      <a
                        className="nav-link text-up color-white font-hammersmith dh-header-nav-link"
                        href="https://dharma2pointo.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        2.0
                      </a>
                    </li>
                    <li className="nav-item mt-3 pt-2 border-top border-white border-opacity-25">
                      <div className="head-social dh-list">{renderHeaderIconList("dh-header-social-ul--start")}</div>
                    </li>
                    <li className="nav-item mt-2">
                      <Link className="nav-link text-white small" href="/fan-landing" onClick={() => setMenuOpen(false)}>
                        Fan Corner
                      </Link>
                    </li>
                  </ul>
                </div>
              : null}
            </div>
          </div>
          <div className="head-curve" aria-hidden="true" />
        </div>
      </nav>
    </header>
  );
}
