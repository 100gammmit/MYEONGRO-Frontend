"use client";

import type { SajuBirthProfile } from "./result";

let pendingBirthProfile: SajuBirthProfile | null = null;

export function rememberSajuBirthProfile(profile: SajuBirthProfile) {
  pendingBirthProfile = structuredClone(profile);
}
export function takeRememberedSajuBirthProfile(): SajuBirthProfile | null {
  const profile = pendingBirthProfile;
  pendingBirthProfile = null;
  return profile ? structuredClone(profile) : null;
}

export function clearRememberedSajuBirthProfile() {
  pendingBirthProfile = null;
}
