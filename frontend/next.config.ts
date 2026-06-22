import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Do NOT use output:'standalone' on Render native Node runner —
  // it breaks static asset serving (.next/static not copied automatically).
  // Use regular `next start` instead.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  },
};

export default nextConfig;
