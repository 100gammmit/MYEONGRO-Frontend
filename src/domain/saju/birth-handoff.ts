import { z } from "zod";

import type { SajuBirthValues } from "./birth-input";

/**
 * Carries a manseryeok input into the AI saju form in the same tab. It lives in sessionStorage only
 * (never the address, never localStorage) and expires after 30 minutes, so a login, sign-up and
 * consent on the way still find it. The form peeks at it on mount and clears it once the user is
 * signed in and past consent; a login redirect in between must not lose it.
 */
export const BIRTH_HANDOFF_KEY = "myeongro.saju.birthHandoff";
export const BIRTH_HANDOFF_TTL_MS = 30 * 60 * 1000;

const valuesSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTimePrecision: z.enum(["exact", "approximate", "unknown"]),
  birthHour: z.string().regex(/^(?:[01]\d|2[0-3])?$/),
  birthMinute: z.string().regex(/^(?:[0-5]\d)?$/),
  provinceCode: z.string().regex(/^(?:\d{2})?$/),
  cityCode: z.string().regex(/^(?:\d{5})?$/),
  luckDirectionBasis: z.enum(["male", "female", "unspecified"]),
  dayBoundary: z.enum(["MIDNIGHT", "HOUR_23"]),
  equationOfTime: z.boolean(),
}).strict();

const recordSchema = z.object({ savedAt: z.number().int(), values: valuesSchema }).strict();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveBirthHandoff(values: SajuBirthValues, now = Date.now()): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(BIRTH_HANDOFF_KEY, JSON.stringify({ savedAt: now, values }));
    return true;
  } catch {
    return false;
  }
}

export function clearBirthHandoff(): void {
  try {
    storage()?.removeItem(BIRTH_HANDOFF_KEY);
  } catch {
    // Storage blocked: nothing was kept either.
  }
}

/**
 * The carried input, or null when there is none, it is broken or it is older than 30 minutes.
 * A valid value stays in place; a broken or expired one is removed.
 */
export function peekBirthHandoff(now = Date.now()): SajuBirthValues | null {
  const store = storage();
  if (!store) return null;
  let raw: string | null;
  try {
    raw = store.getItem(BIRTH_HANDOFF_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let values: SajuBirthValues | null = null;
  try {
    const parsed = recordSchema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      const age = now - parsed.data.savedAt;
      if (age >= 0 && age <= BIRTH_HANDOFF_TTL_MS) values = parsed.data.values;
    }
  } catch {
    values = null;
  }
  if (!values) clearBirthHandoff();
  return values;
}

/** Peeks and removes in one go. */
export function takeBirthHandoff(now = Date.now()): SajuBirthValues | null {
  const values = peekBirthHandoff(now);
  clearBirthHandoff();
  return values;
}
