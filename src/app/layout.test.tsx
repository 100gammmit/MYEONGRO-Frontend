// @vitest-environment node
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/backend/request-cookies", () => ({ getBackendCookieHeader: async () => "" }));
vi.mock("@/infrastructure/backend/session-auth", () => ({ getSpringSessionUser: async () => null }));
vi.mock("@/components/adsense-script", () => ({ AdSenseScript: () => null }));

import { AdSenseScript } from "@/components/adsense-script";
import RootLayout from "./layout";

/** Depth-first search of an unrendered element tree for elements of the given component. */
function findElements(node: ReactNode, type: unknown): ReactElement<{ client: string | null }>[] {
  if (Array.isArray(node)) return node.flatMap((child) => findElements(child, type));
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  const own = node.type === type ? [node as unknown as ReactElement<{ client: string | null }>] : [];
  return [...own, ...findElements(node.props.children, type)];
}

describe("RootLayout advertising", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mounts the AdSense loader once with the configured publisher ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890123456");
    const loaders = findElements(await RootLayout({ children: null }), AdSenseScript);
    expect(loaders).toHaveLength(1);
    expect(loaders[0].props.client).toBe("ca-pub-1234567890123456");
  });

  it("passes no publisher ID while AdSense is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "");
    const [loader] = findElements(await RootLayout({ children: null }), AdSenseScript);
    expect(loader.props.client).toBeNull();
  });
});
