import type { NextConfig } from "next";
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

import { assertReleaseLegalConfiguration } from "./src/domain/consent/release-validation";
import { SECURITY_HEADERS } from "./src/infrastructure/security-headers";

const backendApiUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";

const nextConfig = (phase: string): NextConfig => {
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER) {
    assertReleaseLegalConfiguration();
  }

  return {
    poweredByHeader: false,
    async headers() {
      return [{ source: "/:path*", headers: [...SECURITY_HEADERS] }];
    },
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
};

export default nextConfig;
