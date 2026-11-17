import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true
  },
  productionBrowserSourceMaps: true,
};

export default nextConfig;
