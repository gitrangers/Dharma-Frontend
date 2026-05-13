"use client";

import { useEffect } from "react";

/**
 * Loads FontAwesome CSS after hydration so it does NOT appear as a
 * render-blocking stylesheet.  The files live in /public/css/fa/ with font
 * paths pre-patched to /fonts/fa/ (woff2 files in /public/fonts/fa/).
 *
 * Icons will be invisible for the brief window between first-paint and
 * hydration (~0–300 ms on a real device).  This is acceptable because the
 * icons are decorative social-media brand marks in the header/footer — they
 * are never the LCP element and their absence does not cause layout shift.
 */
const FA_SHEETS = [
  "/css/fa/fontawesome.min.css",
  "/css/fa/brands.min.css",
  "/css/fa/solid.min.css",
];

export function FontAwesomeLazy() {
  useEffect(() => {
    FA_SHEETS.forEach((href) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);

  return null;
}
