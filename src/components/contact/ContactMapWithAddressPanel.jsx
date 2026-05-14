"use client";

import { ContactMapSection } from "@/components/contact/ContactMapSection";
import { CONTACT_GOOGLE_MAPS_URL } from "@/lib/contactOfficeMap";

/** Same map strip + overlay address panel as `/contact-us` (`contact-us/page.jsx`). */
export function ContactMapWithAddressPanel() {
  return (
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
  );
}
