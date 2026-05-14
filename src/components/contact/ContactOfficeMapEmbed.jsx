"use client";

import { CONTACT_GOOGLE_MAPS_URL, CONTACT_MAP_EMBED_SRC } from "@/lib/contactOfficeMap";

/**
 * Map strip from `frontend/views/content/contact-us.html`: `.maps` iframe, “Open in Google Maps”
 * control, and `.dh-absulate.add-show.maps.min-add` address panel. Parent should add `.contact-page`
 * so `_dharma.scss` `.contact-page .add-show` rules apply.
 */
export function ContactOfficeMapEmbed() {
  return (
    <div className="maps dh-relative">
      <div className="w-100">
        <div className="contact-page__map-root">
          <iframe
            className="contact-page__map-canvas contact-page__map-iframe map"
            src={CONTACT_MAP_EMBED_SRC}
            title="Dharma Productions office location"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="contact-page__map-iframe-open">
            <a
              href={CONTACT_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-page__map-iframe-link"
            >
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      </div>
      <div className="dh-absulate add-show maps min-add font-karla">
        <h4>Dharma Productions Pvt. Ltd.</h4>
        <div className="mt15">
          <p>201 &amp; 202, 2nd Floor, Supreme Chambers,</p>
          <p>Off Veera Desai Road, 17/18 Shah Industrial Estate,</p>
          <p>Andheri (W), Mumbai- 400053, India</p>
        </div>
      </div>
    </div>
  );
}
