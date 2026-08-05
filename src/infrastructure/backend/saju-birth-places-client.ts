import type { SajuApiError, SajuBirthPlacesResponse } from "@/domain/saju/contracts";
import { parseSajuBirthPlaces } from "@/domain/saju/schema";

export class SajuBirthPlacesClientError extends Error {
  constructor(
    readonly status: number,
    readonly apiError: SajuApiError,
  ) {
    super(apiError.message);
  }
}

export async function fetchSajuBirthPlaces(): Promise<SajuBirthPlacesResponse> {
  const response = await fetch("/api/saju/birth-places", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new SajuBirthPlacesClientError(response.status, await readError(response));
  }
  return parseSajuBirthPlaces(await response.json());
}

async function readError(response: Response): Promise<SajuApiError> {
  try {
    const value = await response.json() as Partial<SajuApiError> & { error?: string };
    return {
      code: typeof value.code === "string" ? value.code : "BIRTH_PLACES_UNAVAILABLE",
      ...(typeof value.field === "string" ? { field: value.field } : {}),
      message: typeof value.message === "string"
        ? value.message
        : typeof value.error === "string"
          ? value.error
          : "출생지 목록을 불러오지 못했어요.",
    };
  } catch {
    return {
      code: "BIRTH_PLACES_UNAVAILABLE",
      message: "출생지 목록을 불러오지 못했어요.",
    };
  }
}
