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

const nextConfig: NextConfig = {
  /* Silence nested-monorepo Turbopack root warning when multiple lockfiles exist */
  turbopack: {
    root: appDir,
  },
};

export default nextConfig;
