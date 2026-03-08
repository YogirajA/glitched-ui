import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The agent pipeline lives in a private repo (@glitched/agents).
  // When that package is not installed, the API route falls back to
  // the AGENTS_API_URL env variable (external service) or mock mode.
  // serverExternalPackages is the Next.js 15+ API (previously experimental.serverComponentsExternalPackages)
  serverExternalPackages: ["@glitched/agents"],
};

export default nextConfig;
