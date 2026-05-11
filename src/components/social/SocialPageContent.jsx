import Image from "next/image";
import Link from "next/link";

/**
 * Legacy Angular `frontend/views/content/dharma-world.html` — `/social` (Social nav).
 */
export function SocialPageContent() {
  return (
    <>
      {/* Hero — bg-image fills the container so it never collapses on mobile */}
      <section className="social-page-hero text-center text-white">
        <div className="social-page-hero__inner">
          <Image
            src="/frontend/img/dharma-word.png"
            alt="Dharma Productions"
            width={720}
            height={200}
            className="img-fluid social-page-hero__logo mx-auto d-block"
            priority
            sizes="(max-width: 768px) 88vw, 560px"
          />
          <div className="social-page-hero__copy f18">
            <p className="margin0">For those whose dharma is Dharma, welcome home.</p>
            <p className="mb-0">
              Entertainment, Interaction, Merchandise and more; we bring to you the best of the Dharma
              Family.
            </p>
          </div>
        </div>
      </section>

      <section className="social-page-bands min-m-flex">
        <div className="social-page-band-row row-flex">
          <div className="social-page-band-col col-flex">
            <div className="full-image">
              <Image
                src="/frontend/img/dharma-world/d1.jpg"
                alt="Dharma Productions"
                width={960}
                height={640}
                className="img-fluid w-100 d-block"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="social-page-band-col col-flex">
            <div className="full-image">
              <Link href="/fan-landing" className="d-block text-decoration-none">
                <Image
                  src="/frontend/img/dharma-world/d3.jpg"
                  alt="Dharma Productions — Fan corner"
                  width={960}
                  height={640}
                  className="img-fluid w-100 d-block"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
