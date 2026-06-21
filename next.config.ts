import type { NextConfig } from "next";

const backendApiUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/consents",
          destination: `${backendApiUrl}/api/consents`,
        },
        {
          source: "/api/readings",
          destination: `${backendApiUrl}/api/readings`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
