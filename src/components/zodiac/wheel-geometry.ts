import { ZODIAC_SLUGS, type ZodiacSlug } from "@/domain/zodiac-fortune/slugs";

/** Where a sign sits on a wheel: 자 at the top, then clockwise every 30°, rounded to 0.1. */
export function wheelPoint(slug: ZodiacSlug, center: number, radius: number): [number, number] {
  const angle = ((-90 + 30 * ZODIAC_SLUGS.indexOf(slug)) * Math.PI) / 180;
  return [roundTenth(center + radius * Math.cos(angle)), roundTenth(center + radius * Math.sin(angle))];
}

export function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
