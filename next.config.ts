import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.16.12.230'],
  turbopack: { root: 'C:\\dev\\lrtj-project' },
  outputFileTracingRoot: 'C:\\dev\\lrtj-project',
};

export default nextConfig;
