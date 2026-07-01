import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trailing slashes help iOS PWA scope matching
  // Without this, /home may be considered outside scope of /
  trailingSlash: true,
  experimental: {
    // @ts-expect-error nodeMiddleware is supported at runtime but not yet in Next.js TS types
    nodeMiddleware: true,
  },
};

export default nextConfig;
