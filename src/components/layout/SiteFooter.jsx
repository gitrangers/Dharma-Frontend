import Image from "next/image";
import Link from "next/link";

/** Mirrors `frontend/views/footer.html` (dharmanodeRun). */

const FOOTER_SOCIAL = [
  {
    href: "https://www.facebook.com/DharmaMovies/?fref=ts",
    icon: "fa-brands fa-facebook-f",
    label: "Facebook",
  },
  {
    href: "https://twitter.com/DharmaMovies",
    icon: "fa-brands fa-twitter",
    label: "Twitter",
  },
  {
    href: "https://www.instagram.com/dharmamovies/?hl=en",
    icon: "fa-brands fa-instagram",
    label: "Instagram",
  },
  {
    href: "https://www.youtube.com/c/dharmamovies",
    icon: "fa-brands fa-youtube",
    label: "YouTube",
  },
  {
    href: "https://www.pinterest.com/dharmamovies/",
    icon: "fa-brands fa-pinterest-p",
    label: "Pinterest",
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6 col-sm-12">
            <div className="footer-data dh-list mobile-center">
              <ul className="padding0 margin0">
                <li className="pointer">
                  <Link href="/privacy-policy">Privacy Policy</Link>
                </li>
                <li className="pointer">
                  <Link href="/disclaimer">Disclaimer</Link>
                </li>
              </ul>
            </div>

            <div className="footer-social dh-list mt15 mobile-center pd10">
              <ul className="padding0 margin0">
                {FOOTER_SOCIAL.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                      <i className={item.icon} aria-hidden />
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="http://www.dailymotion.com/DharmaMovies"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Dailymotion"
                    className="footer-daily-link"
                  >
                    <span className="footer-daily-imgwrap">
                      <Image
                        src="/frontend/img/daily.png"
                        alt=""
                        width={35}
                        height={35}
                        className="mt-7 daily-image"
                      />
                      <Image
                        src="/frontend/img/daily_hover.png"
                        alt=""
                        width={35}
                        height={35}
                        className="mt-7 hover-daily"
                      />
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-md-6 col-sm-12">
            <div className="float-right copy mt15 mobile-center pd18 footer-copy-col">
              <p>Copyright © {year} Dharma Productions Pvt. Ltd.</p>
              <p className="float-right mobile-center ting-line mb-0">
                <a
                  href="https://www.ting.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-ting-anchor text-decoration-none"
                >
                  <span className="foot-right ting-unit-wrap d-inline-flex">
                    <span className="made-by-text">
                      <span className="made-by-text__line">made</span>
                      <span className="made-by-text__line">by</span>
                    </span>
                    <Image
                      src="/frontend/img/ting-img.png"
                      alt="Ting"
                      width={90}
                      height={32}
                      className="img-responsive footer-ting-logo"
                      sizes="90px"
                    />
                  </span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
