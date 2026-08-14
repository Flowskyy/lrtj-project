import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['172.16.12.230'],
  logging: {
    incomingRequests: {
      ignore: [/\/api\/auth\/heartbeat/],
    },
  },
};

export default nextConfig;
