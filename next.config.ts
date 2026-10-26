import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e/screenshot run builds into its own folder so it never clobbers a `next dev` in progress.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
