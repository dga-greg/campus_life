import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets the Playwright run (which uses 127.0.0.1) load dev assets.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
