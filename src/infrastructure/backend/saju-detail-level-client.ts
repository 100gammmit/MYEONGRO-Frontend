import { z } from "zod";

import type { SajuBirthProfile, SajuCalculationOptions } from "@/domain/saju/contracts";

/**
 * Asks, before credits are spent, which annual report a birth input gets (full or brief) and what it costs.
 * The backend calculates exactly as the reading would and keeps nothing; the reading still decides the charge.
 */
export type AnnualDetailLevel = "full" | "brief";

export type AnnualDetailLevelOutcome =
  | { readonly kind: "ok"; readonly detailLevel: AnnualDetailLevel; readonly creditCost: number }
  | { readonly kind: "unauthenticated" }
  | { readonly kind: "failed" };

const responseSchema = z.object({
  detailLevel: z.enum(["full", "brief"]),
  creditCost: z.number().int().positive(),
}).strict();

export async function fetchAnnualDetailLevel(
  request: { readonly birthProfile: SajuBirthProfile; readonly calculationOptions?: SajuCalculationOptions },
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<AnnualDetailLevelOutcome> {
  try {
    const response = await fetcher("/api/saju/readings/detail-level", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
    if (response.status === 401) return { kind: "unauthenticated" };
    if (!response.ok) return { kind: "failed" };
    const parsed = responseSchema.safeParse(await response.json());
    return parsed.success ? { kind: "ok", ...parsed.data } : { kind: "failed" };
  } catch {
    // A dropped connection or an abort: the screen shows both prices and the reading decides.
    return { kind: "failed" };
  }
}
