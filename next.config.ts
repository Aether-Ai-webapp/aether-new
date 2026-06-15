import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
    "127.0.0.1",
    "21.0.3.25",
    "21.0.21.136",
  ],
};

export default nextConfig;
