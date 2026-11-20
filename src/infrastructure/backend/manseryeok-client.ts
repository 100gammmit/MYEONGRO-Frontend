import type { SajuBirthPlacesResponse, SajuBirthProfile, SajuCalculationOptions } from "@/domain/saju/contracts";
import { parseSajuBirthPlaces } from "@/domain/saju/schema";
import { parseManseryeokChart, type ManseryeokChart } from "@/domain/manseryeok/schema";

/**
 * The browser calls the public calculation API on the API domain directly, without cookies, so the
 * backend's per-IP limit sees the visitor rather than the web server. Nothing here is stored.
 */
export interface ManseryeokRequest {
  readonly birthProfile: SajuBirthProfile;
  readonly options?: SajuCalculationOptions;
  /** Only for next year; this year is the server's default and is never sent as a number. */
  readonly referenceYear?: number;
}

export type ManseryeokOutcome =
  | { readonly kind: "ok"; readonly chart: ManseryeokChart }
  | { readonly kind: "invalid"; readonly code: string; readonly field?: string; readonly message: string }
  | { readonly kind: "rateLimited" }
  | { readonly kind: "busy" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "failed" };

const RETRIED_CODES = new Set(["SAJU_CALCULATION_BUSY", "SAJU_CALCULATION_DEADLINE", "SAJU_CALCULATION_RATE_LIMIT_UNAVAILABLE"]);
export const MAX_BUSY_RETRIES = 2;

export interface ManseryeokClientOptions {
  /** Called before each automatic retry, so the screen can say it is trying again. */
  readonly onRetry?: (attempt: number) => void;
  readonly wait?: (milliseconds: number) => Promise<void>;
  readonly random?: () => number;
  readonly fetcher?: typeof fetch;
}

const defaultWait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function calculateManseryeok(
  endpoint: string,
  request: ManseryeokRequest,
  { onRetry, wait = defaultWait, random = Math.random, fetcher = fetch }: ManseryeokClientOptions = {},
): Promise<ManseryeokOutcome> {
  const body = JSON.stringify({
    birthProfile: request.birthProfile,
    ...(request.options ? { options: request.options } : {}),
    ...(request.referenceYear !== undefined ? { referenceYear: request.referenceYear } : {}),
  });
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetcher(endpoint, {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch {
      return { kind: "failed" };
    }
    if (response.ok) {
      const chart = parseManseryeokChart(await response.json().catch(() => null));
      return chart ? { kind: "ok", chart } : { kind: "failed" };
    }
    if (response.status === 404) return { kind: "unavailable" };
    if (response.status === 429) return { kind: "rateLimited" };
    const error = await readError(response);
    if (response.status === 400) {
      return { kind: "invalid", code: error.code, message: error.message, ...(error.field ? { field: error.field } : {}) };
    }
    if (response.status === 503 && RETRIED_CODES.has(error.code)) {
      if (attempt >= MAX_BUSY_RETRIES) return { kind: "busy" };
      onRetry?.(attempt + 1);
      // Spread retries out so a crowd that hit the same busy moment does not come back together.
      await wait(800 + Math.floor(random() * 800));
      continue;
    }
    return { kind: "failed" };
  }
}

export type BirthPlacesOutcome =
  | { readonly kind: "ok"; readonly places: SajuBirthPlacesResponse }
  | { readonly kind: "unavailable" }
  | { readonly kind: "failed" };

/** A 404 means the public calculator is switched off, which the page shows as "coming soon". */
export async function fetchPublicBirthPlaces(endpoint: string, fetcher: typeof fetch = fetch): Promise<BirthPlacesOutcome> {
  try {
    const response = await fetcher(endpoint, { credentials: "omit", cache: "no-store" });
    if (response.status === 404) return { kind: "unavailable" };
    return response.ok ? { kind: "ok", places: parseSajuBirthPlaces(await response.json()) } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

async function readError(response: Response): Promise<{ code: string; field?: string; message: string }> {
  try {
    const value = await response.json() as { code?: unknown; field?: unknown; error?: unknown; message?: unknown };
    return {
      code: typeof value.code === "string" ? value.code : "UNKNOWN",
      ...(typeof value.field === "string" ? { field: value.field } : {}),
      message: typeof value.error === "string" ? value.error : typeof value.message === "string" ? value.message : "입력을 확인해 주세요.",
    };
  } catch {
    return { code: "UNKNOWN", message: "입력을 확인해 주세요." };
  }
}
