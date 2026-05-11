import Image from "next/image";

export const metadata = {
  title: "Disclaimer — Dharma Productions",
  description:
    "Dharma Productions website disclaimer and casting/recruitment policy for visitors.",
};

/** Matches privacy hero breakpoints — same artwork (`privacy.jpg`). */
const DISCLAIMER_HERO_SIZES =
  "(max-width: 430px) 100vw, (max-width: 765px) 100vw, (max-width: 820px) 100vw, (max-width: 1199px) 100vw, min(1536px, 100vw)";

export default function DisclaimerPage() {
  return (
    <div className="disclaimer-page">
      <section aria-label="Disclaimer hero">
        <div className="banner dh-relative disclaimer-page__banner">
          <Image
            src="/frontend/img/privacy.jpg"
            alt="Dharma Productions"
            fill
            className="disclaimer-page__hero-img"
            sizes={DISCLAIMER_HERO_SIZES}
            priority
          />
          <div className="banner-title text-center dh-absulate middle">
            <h1 className="color-white font-hammersmith f120 margin0 disclaimer-page__hero-title">
              DISCLAIMER
            </h1>
          </div>
        </div>
      </section>

      <section className="disclaimer-page__copy-section">
        <div className="container disclaimer-page__container">
          <div className="row">
            <div className="col-12">
              <div className="data-abt mt30 disclaimer-page__data-abt">
                <p>
                  Dharma Productions Pvt. Ltd. is pleased that you are visiting this site and we are
                  pleased to provide the information on this server. However, we need to advise you
                  of some legal limitations and restrictions that we impose to all visitors to this
                  and related sites. We ask that you respect the rules described below:
                </p>
                <p>
                  You may print copies of the information on this site for your personal use and
                  store the files on your computer for personal use. You may not distribute text or
                  graphics to others without the express written consent of Dharma Productions Pvt.
                  Ltd. Also, you may not, without our permission, copy and distribute this
                  information on any other server, or modify or reuse text or graphics on this or any
                  another system.
                </p>
                <p>
                  No reproduction of any part of the site may be sold or distributed for commercial
                  gain, nor shall it be modified or incorporated in any other work, publication or
                  site, whether in hard copy or electronic format, including postings to any other
                  site.
                </p>
                <p>
                  The information on this site has been included in good faith and is for general
                  purposes only. It should not be relied upon for any specific purpose and no
                  representation or warranty is given as regards its accuracy or completeness.
                </p>
                <p>
                  Dharma Productions Pvt. Ltd. retains copyright on all the text, graphics and
                  trademarks displayed on this site. All the text, graphics and trademarks displayed on
                  this site are owned by Dharma Productions Pvt. Ltd.
                </p>
              </div>

              <div className="data-abt mt30 pb30 disclaimer-page__data-abt disclaimer-page__data-abt--casting">
                <h5 className="disclaimer-page__casting-heading">
                  <strong>DISCLAIMER FOR CASTING/ RECRUITMENT</strong>
                </h5>
                <p>
                  We at Dharma Productions Private Limited (&quot;Dharma&quot;) follow strict policies
                  and procedures with respect to recruitment and casting.
                </p>
                <p>
                  Dharma states that it does not associate with any agent, agency or any other
                  person(s) for the same without an appropriate legal agreement authorizing them to
                  act on it&apos;s behalf.
                </p>
                <p>
                  Dharma does not indulge in making monetary requests from any candidate(s) for the
                  purpose of recruitment and/or casting such candidate(s) whether through authorised
                  agents or otherwise.
                </p>
                <p>
                  If at any stage of recruitment and/or casting any monetary request is made to the
                  candidate, Dharma strictly advises the candidate to ignore such request or
                  initiate appropriate legal proceedings as may be advised in law in this regard.
                </p>
                <p>
                  Dharma shall not be held responsible for any such fraudulent email/phone
                  call/message asking the candidate for any monies, their bank account or credit card
                  details for an audition and/or employment opportunity with Dharma and the same
                  shall be dealt with by the candidate entirely at its own risk, cost and expense.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
