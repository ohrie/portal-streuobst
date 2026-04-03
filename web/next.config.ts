import type { NextConfig } from "next";
import { execSync } from "child_process";
let gitSha = process.env.GIT_SHA ?? "";
if (!gitSha) {
  try {
    gitSha = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    gitSha = "unknown";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GIT_SHA: gitSha,
  },
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },

  // Dev-only: proxy /api/ to the local FastAPI server (rewrites are ignored in static export)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
