"use client";

/**
 * Loads Google Maps only when scrolled into view; shares one script injection per tab.
 * Mirrors legacy `frontend/js/controllers.js` MapCtrl coords + marker (styled map wired here;
 * Angular never attached StyledMapType to the instance).
 */

import { useEffect, useRef } from "react";

import { CONTACT_GOOGLE_MAPS_URL } from "@/lib/contactOfficeMap";

const LOCATION = Object.freeze({ lat: 19.133687, lng: 72.836493 });

const MAP_THEME = Object.freeze([
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#f2f2f2" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "all",
    stylers: [{ saturation: -100 }, { lightness: 45 }],
  },
  {
    featureType: "road.highway",
    elementType: "all",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "all",
    stylers: [{ color: "#f5b690" }, { visibility: "on" }],
  },
]);

let mapsScriptPromise;

function loadGoogleMapsJs(apiKey) {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));

  const gmaps = typeof window !== "undefined" ? window.google?.maps : null;
  if (gmaps) return Promise.resolve();

  if (!mapsScriptPromise) {
    mapsScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-dharma-google-maps]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("maps script error")));
        return;
      }
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      s.async = true;
      s.defer = true;
      s.dataset.dharmaGoogleMaps = "1";
      s.onload = () => resolve();
      s.onerror = () => {
        mapsScriptPromise = null;
        reject(new Error("maps script error"));
      };
      document.head.appendChild(s);
    });
  }

  return mapsScriptPromise;
}

export function ContactMapEmbed() {
  const rootRef = useRef(null);
  const mapElRef = useRef(null);
  const mapRef = useRef(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const root = rootRef.current;
    const el = mapElRef.current;
    if (!root || !el || !apiKey) return undefined;

    let cancelled = false;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || cancelled) return;
        io.disconnect();
        loadGoogleMapsJs(apiKey)
          .then(() => {
            if (cancelled || !el) return;
            const maps = window.google?.maps;
            if (!maps || mapRef.current) return;

            const styled = new maps.StyledMapType(MAP_THEME, { name: "Dharma Style" });
            const map = new maps.Map(el, {
              zoom: 17,
              center: LOCATION,
              scrollwheel: false,
              mapTypeControl: false,
              fullscreenControl: true,
              streetViewControl: false,
            });
            map.mapTypes.set("dharma_style", styled);
            map.setMapTypeId("dharma_style");
            mapRef.current = map;

            new maps.Marker({
              position: LOCATION,
              map,
              icon: {
                url: "/frontend/img/dharmamapmarker.png",
                scaledSize: new maps.Size(75, 60),
              },
            });
          })
          .catch(() => {
            el.classList.add("contact-page__map--failed");
          });
      },
      { rootMargin: "120px 0px", threshold: 0.02 },
    );

    io.observe(root);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="contact-page__map-root">
        <iframe
          className="contact-page__map-canvas contact-page__map-iframe"
          src="https://maps.google.com/maps?q=19.133687,72.836493&z=17&output=embed"
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
    );
  }

  return (
    <div className="contact-page__map-root" ref={rootRef}>
      <div id="dh-contact-map" className="map contact-page__map-canvas" ref={mapElRef} role="region" aria-label="Office location map" />
    </div>
  );
}
