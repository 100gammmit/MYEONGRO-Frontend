import { ZODIAC_SLUGS, type ZodiacSlug } from "@/domain/zodiac-fortune";

import { wheelPoint } from "./wheel-geometry";

/** A small decorative wheel for the home band: twelve dots with the year's sign in gold. */
export function ZodiacMiniWheel({ yearAnimal, yearName, year, className }: {
  yearAnimal: ZodiacSlug;
  yearName: string;
  year: number;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100">
      <circle cx="50" cy="50" fill="none" r="38" stroke="rgba(230,235,247,.14)" />
      {ZODIAC_SLUGS.map((slug) => {
        const [cx, cy] = wheelPoint(slug, 50, 38);
        const isYear = slug === yearAnimal;
        return (
          <circle
            cx={cx}
            cy={cy}
            fill={isYear ? "#e8b54a" : "#3a3f52"}
            key={slug}
            r={isYear ? 6 : 4}
          />
        );
      })}
      <text dominantBaseline="middle" fill="#e6ebf7" fontFamily="'Noto Serif KR Variable', serif" fontSize="13" textAnchor="middle" x="50" y="47">
        {yearName}의 해
      </text>
      <text dominantBaseline="middle" fill="#9ba7c1" fontSize="9" textAnchor="middle" x="50" y="62">{year}</text>
    </svg>
  );
}
