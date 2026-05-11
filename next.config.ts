import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Folder that contains this `next.config` file (always `DharmaNextLatest`), not `process.cwd()` (which may be the monorepo root). */
const appDir = path.dirname(fileURLToPath(import.meta.url));
/** Repo root next to the Next app (e.g. `dharmanodeRun/.env`). */
const repoRoot = path.resolve(appDir, "..");
const isDev = process.env.NODE_ENV !== "production";

// Load parent `.env` first, then this app’s `.env` / `.env.local` so DharmaNextLatest can override.
loadEnvConfig(repoRoot, isDev);
loadEnvConfig(appDir, isDev);

function hostnameFromEnv(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const normalized = /^https?:\/\//i.test(url) ? url.trim() : `https://${url.trim()}`;
    return new URL(normalized).hostname || undefined;
  } catch {
    return undefined;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Allow `next/image` for CMS uploads, YouTube thumbs, and env-configured hosts. */
function remoteImagePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const fromEnv = [
    hostnameFromEnv(process.env.NEXT_PUBLIC_API_URL),
    hostnameFromEnv(process.env.API_URL),
    hostnameFromEnv(process.env.NEXT_PUBLIC_UPLOAD_BASE),
    hostnameFromEnv(process.env.NEXT_PUBLIC_STRAPI_ASSETS_URL),
    hostnameFromEnv(process.env.NEXT_PUBLIC_IMAGE_URL),
    hostnameFromEnv(process.env.NEXT_PUBLIC_STRAPI_URL),
    hostnameFromEnv(process.env.STRAPI_URL),
    hostnameFromEnv(process.env.STRAPI_API_URL),
    hostnameFromEnv(process.env.NEXT_IMAGE_URL),
  ].filter(Boolean) as string[];

  const hosts = new Set<string>([
    ...fromEnv,
    "dharmacms2.tinglabs.in",
    "img.youtube.com",
    "i.ytimg.com",
  ]);

  return Array.from(hosts).flatMap((hostname) => {
    if (isLoopbackHost(hostname)) {
      return [
        { protocol: "http" as const, hostname, pathname: "/**" as const },
        { protocol: "https" as const, hostname, pathname: "/**" as const },
      ];
    }
    return [{ protocol: "https" as const, hostname, pathname: "/**" as const }];
  });
}

const nextConfig: NextConfig = {
  /* Silence nested-monorepo Turbopack root warning when multiple lockfiles exist */
  turbopack: {
    root: appDir,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: remoteImagePatterns(),
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
  },
};

export default nextConfig;
