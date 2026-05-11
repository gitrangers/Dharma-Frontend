import Image from "next/image";

export const metadata = {
  title: "Privacy Policy — Dharma Productions",
  description:
    "Dharma Productions privacy statement: how we collect and use information on this website.",
};

/** Next/Image `sizes` tuned for typical device widths + DPR (~412, 765, 820, 1440–1536). */
const PRIVACY_HERO_SIZES =
  "(max-width: 430px) 100vw, (max-width: 765px) 100vw, (max-width: 820px) 100vw, (max-width: 1199px) 100vw, min(1536px, 100vw)";

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-page">
      <section aria-label="Privacy policy hero">
        <div className="banner dh-relative privacy-page__banner">
          <Image
            src="/frontend/img/privacy.jpg"
            alt="Dharma Productions"
            fill
            className="privacy-page__hero-img"
            sizes={PRIVACY_HERO_SIZES}
            priority
          />
          <div className="banner-title text-center dh-absulate middle">
            <h1 className="color-white font-hammersmith f120 margin0 privacy-page__hero-title">
              PRIVACY POLICY
            </h1>
          </div>
        </div>
      </section>

      <section className="privacy-page__copy-section">
        <div className="container privacy-page__container">
          <div className="row">
            <div className="col-12">
              <div className="data-abt mt30 pb30 privacy-page__data-abt">
                <h4>
                  PLEASE READ THIS PRIVACY STATEMENT CAREFULLY BEFORE USING THIS WEB SITE OR OTHER
                  RELATED SITES OF THE COMPANY
                </h4>
                <p>
                  Welcome to this Dharma Productions website. We at Dharma Production respect the
                  privacy of everyone who visits this website and are committed to maintaining the
                  privacy and security of the personal information of all visitors to this website.
                  Our policy on the collection and use of personal information and other information
                  is outlined below.
                </p>
                <p>
                  We do not require personal information to obtain access to most of our website.
                  We collect personal information from our visitors on a voluntary basis. Personal
                  information may include name, phone number, email address, and other relevant data.
                  Questions or comments submitted by visitors may also include personal information.
                </p>
                <p>
                  We collect and use personal information for business purposes in order to provide
                  information or interactive services through this website, to your e-mail address
                  or, where you wish it to be sent by post, to your name and postal address; to seek
                  your feedback or to contact you in relation to those services offered on the
                  website.
                </p>
                <p>
                  At all times we attempt to treat the information about you we receive on the
                  internet with care deemed reasonable under the circumstances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
