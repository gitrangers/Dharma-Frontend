"use client";

import { ContactDeptIcon } from "@/components/contact/ContactDeptIcon";
import {
  CONTACT_EMAIL_BLOCKS_ROW1,
  CONTACT_EMAIL_BLOCKS_ROW2,
} from "@/components/contact/contactDepartmentBlocks";

/** Department tiles — identical markup for home and `/contact-us`. */
export function ContactDepartmentEmails() {
  return (
    <div className="container">
      <div className="padd-all-side">
        <div className="row g-4">
          {CONTACT_EMAIL_BLOCKS_ROW1.map((b) => (
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
          {CONTACT_EMAIL_BLOCKS_ROW2.map((b) => (
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
  );
}
