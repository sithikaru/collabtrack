import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during builds (useful for CI/CD pipelines).
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors.
    ignoreBuildErrors: false, // Set to true only if absolutely necessary.
  },
  experimental: {
    // Add experimental features here when needed
  },
  reactStrictMode: true, // Recommended for catching potential issues in development.
  swcMinify: true, // Enable faster builds with the SWC compiler.
};

export default nextConfig;
