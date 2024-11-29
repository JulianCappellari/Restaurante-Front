import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true
},
productionSourceMaps: true,
};

export default nextConfig;
