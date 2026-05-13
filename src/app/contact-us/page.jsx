import Image from "next/image";

import { ContactDeptIcon } from "@/components/contact/ContactDeptIcon";
import { ContactMapSection } from "@/components/contact/ContactMapSection";
import { CONTACT_GOOGLE_MAPS_URL } from "@/lib/contactOfficeMap";

export const metadata = {
  title: "Contact Us — Dharma Productions",
  description:
    "Contact Dharma Productions — Mumbai office address and department email: info, creative, marketing, syndication, legal.",
};

/* Intrinsic PNG dims from `public/frontend/img/*.png` — legacy had no CSS size (dharmanodeRun `contact-us.html`). */
const EMAIL_BLOCKS_ROW1 = [
  {
    key: "info",
    title: "INFO",
    src: "/frontend/img/info.png",
    iconWidth: 25,
    iconHeight: 25,
    lines: <>For info related queries email us on</>,
    email: "info@dharma-production.com",
  },
  {
    key: "creative",
    title: "CREATIVE",
    src: "/frontend/img/creativity.png",
    iconWidth: 30,
    iconHeight: 33,
    lines: <>For creative related queries email us on</>,
    email: "creative@dharma-production.com",
  },
  {
    key: "marketing",
    title: "MARKETING",
    src: "/frontend/img/marketing.png",
    iconWidth: 25,
    iconHeight: 29,
    lines: <>For info marketing queries email us on</>,
    email: "marketing@dharma-production.com",
  },
];

const EMAIL_BLOCKS_ROW2 = [
  {
    key: "syndication",
    title: "SYNDICATION",
    src: "/frontend/img/syndication.png",
    iconWidth: 28,
    iconHeight: 28,
    lines: <>For info syndication queries email us on</>,
    email: "syndication@dharma-production.com",
  },
  {
    key: "legal",
    title: "LEGAL",
    src: "/frontend/img/legal.png",
    iconWidth: 27,
    iconHeight: 33,
    lines: <>For legal related queries contact us on</>,
    email: "legal@dharma-production.com",
  },
];

const LOCAL_BUSINESS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dharma Productions Pvt. Ltd.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "201 & 202, 2nd Floor, Supreme Chambers, Off Veera Desai Road, 17/18 Shah Industrial Estate",
    addressLocality: "Andheri (W)",
    addressRegion: "Mumbai",
    postalCode: "400053",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 19.133687,
    longitude: 72.836493,
  },
};

export default function ContactUsPage() {
  return (
    <div className="contact-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }}
      />

      <section>
        <div className="banner dh-relative">
          <Image
            src="/frontend/img/contact-new.jpg"
            alt="Contact Dharma Productions"
            width={1920}
            height={640}
            className="img-fluid w-100 d-block contact-page__hero-img"
            sizes="100vw"
            priority
          />
        </div>
      </section>

      <section>
        <div className="dh-relative">
          <div className="w-100">
            <ContactMapSection />
          </div>
          <div className="dh-absulate add-show maps min-add">
            <h4 className="margin0 font-karla">Dharma Productions Pvt. Ltd.</h4>
            <div className="mt15 font-karla">
              <p className="margin0">201 &amp; 202, 2nd Floor, Supreme Chambers,</p>
              <p className="margin0">Off Veera Desai Road, 17/18 Shah Industrial Estate,</p>
              <p className="margin0">Andheri (W), Mumbai- 400053, India</p>
              <p className="margin0 mt-3">
                <a
                  href={CONTACT_GOOGLE_MAPS_URL}
                  className="text-white text-decoration-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="padd-all-side">
            <div className="row g-4">
              {EMAIL_BLOCKS_ROW1.map((b) => (
                <div key={b.key} className="col-md-4 col-sm-12">
                  <article className="contact-info text-center h-100">
                    <div className="contact-info__head">
                      <span className="contact-info__icon info-icon" aria-hidden>
                        <ContactDeptIcon
                          src={b.src}
                          alt=""
                          width={b.iconWidth}
                          height={b.iconHeight}
                        />
                      </span>
                      <h2 className="contact-info__title color-primary font-karla font-bold margin0">
                        {b.title}
                      </h2>
                    </div>
                    <div className="descp">
                      <p>
                        {b.lines}
                        <br />
                        <a href={`mailto:${b.email}`} className="text-break">
                          {b.email}
                        </a>
                      </p>
                    </div>
                  </article>
                </div>
              ))}
            </div>
            <div className="row mt20 g-4 justify-content-center">
              <div className="d-none d-md-block col-md-2" aria-hidden />
              {EMAIL_BLOCKS_ROW2.map((b) => (
                <div key={b.key} className="col-12 col-md-4">
                  <article className="contact-info text-center h-100">
                    <div className="contact-info__head">
                      <span className="contact-info__icon info-icon" aria-hidden>
                        <ContactDeptIcon
                          src={b.src}
                          alt=""
                          width={b.iconWidth}
                          height={b.iconHeight}
                        />
                      </span>
                      <h2 className="contact-info__title color-primary font-karla font-bold margin0">
                        {b.title}
                      </h2>
                    </div>
                    <div className="descp">
                      <p>
                        {b.lines}
                        <br />
                        <a href={`mailto:${b.email}`} className="text-break">
                          {b.email}
                        </a>
                      </p>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
