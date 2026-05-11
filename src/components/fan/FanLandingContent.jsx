import Link from "next/link";

/**
 * Legacy Angular `frontend/views/content/fan-landing.html` — FAN CORNER title block + two stacked image links.
 */
export function FanLandingContent() {
  return (
    <div className="fan-bg fan-landing-page padder-up">
      <div className="container">
        <div className="dharma-insta">
          <div className="text-center text-white">
            <h1 className="super-big font-hammersmith">Fan Corner</h1>
            <p className="descriptive mb-0">
              With Dharma, you&apos;re always entertained. Enter the fan-corner and play some games!
            </p>
          </div>
        </div>
      </div>

      <div className="container-fluid px-0">
        <div className="row g-0">
          <div className="col-12">
            <div className="fan-landing-pad-img">
              <div className="main-gb">
                <Link href="/fan-corner" className="fan-landing-band-link d-block text-decoration-none">
                  {/* eslint-disable-next-line @next/next/no-img-element -- legacy full-bleed responsive banners */}
                  <img
                    src="/frontend/img/fan-main.jpg"
                    alt="Dharma Production"
                    className="img-fluid w-100 d-block"
                    loading="eager"
                    decoding="async"
                  />
                </Link>
              </div>
              <div className="main-gb">
                <Link href="/dictionary" className="fan-landing-band-link d-block text-decoration-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/frontend/img/fan-main2.jpg"
                    alt="Dharma Production"
                    className="img-fluid w-100 d-block"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
