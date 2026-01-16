import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trailing slashes help iOS PWA scope matching
  // Without this, /home may be considered outside scope of /
  trailingSlash: true,
};

export default nextConfig;
