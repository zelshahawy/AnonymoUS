import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/login',
        destination: 'http://localhost:8081/login',       // no trailing slash
      },
      {
        source: '/heartbeat',
        destination: 'http://localhost:8081/heartbeat',
      },
    ]
  },
};

export default nextConfig;
