"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

/**
 * Matches legacy Angular: `<img>` with no CSS dimensions — uses each PNG's intrinsic px size
 * (`frontend/views/content/contact-us.html` + `main.scss` `.info-icon` only adds `vertical-align`).
 * `doneLoading` restores legacy fade-in behaviour.
 */
export function ContactDeptIcon({ src, alt = "", width, height }) {
  const [done, setDone] = useState(false);
  const finish = useCallback(() => setDone(true), []);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`contact-info__icon-img${done ? " doneLoading" : ""}`}
      onLoadingComplete={finish}
      onError={finish}
    />
  );
}
