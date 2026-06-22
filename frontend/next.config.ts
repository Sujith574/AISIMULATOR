import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'standalone' output is recommended for self-hosted deployments (Render, Docker).
  // It bundles only the necessary files for production.
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  },
};

export default nextConfig;
