import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker multi-stage build.
  // Produces a self-contained .next/standalone/server.js
  // that does NOT need node_modules at runtime.
  output: "standalone",
};

export default nextConfig;
