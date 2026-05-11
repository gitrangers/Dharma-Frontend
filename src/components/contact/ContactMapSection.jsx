"use client";

import dynamic from "next/dynamic";

const ContactMapEmbed = dynamic(
  () => import("./ContactMapEmbed").then((m) => m.ContactMapEmbed),
  {
    ssr: false,
    loading: () => (
      <div className="contact-page__map-root contact-page__map-root--loading" aria-hidden>
        <div className="map contact-page__map-canvas contact-page__map-canvas--skeleton" />
      </div>
    ),
  },
);

/** Client-only: Google Maps script + `ssr: false` dynamic (not allowed in Server Components). */
export function ContactMapSection() {
  return (
    <div className="w-100">
      <ContactMapEmbed />
    </div>
  );
}
