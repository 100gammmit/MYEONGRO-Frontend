export interface MenuLink {
  readonly href: string;
  readonly label: string;
}

export interface MenuGroup {
  readonly label: string;
  readonly links: readonly MenuLink[];
}

export interface ReadingCategory {
  readonly id: "tarot" | "saju";
  readonly label: string;
  readonly groups: readonly MenuGroup[];
}

/**
 * The header's two categories. Each group is one column, so a new group widens the menu instead of
 * lengthening it. The zodiac year comes from the server layout so the header never bundles the year's text.
 */
export function readingCategories(zodiacYear?: number): readonly ReadingCategory[] {
  return [
  {
    id: "tarot",
    label: "타로",
    groups: [
      { label: "서비스", links: [{ href: "/tarot", label: "AI 타로 리딩" }, { href: "/tarot/daily", label: "오늘의 운세" }] },
      { label: "읽을거리", links: [{ href: "/guide/tarot", label: "타로 사용 가이드" }, { href: "/guide/tarot/example", label: "리딩 예시" }] },
    ],
  },
  {
    id: "saju",
    label: "사주",
    groups: [
      {
        label: "서비스",
        links: [
          { href: "/saju", label: "AI 사주 리딩" },
          { href: "/manseryeok", label: "만세력 계산" },
          { href: "/zodiac", label: zodiacYear ? `${zodiacYear} 띠별 신년운세` : "띠별 신년운세" },
        ],
      },
      {
        label: "읽을거리",
        links: [
          { href: "/saju/dictionary", label: "사주 개념 사전" },
          { href: "/guide/saju", label: "사주 사용 가이드" },
          { href: "/guide/saju/annual-report", label: "한 해 리포트 읽는 법" },
        ],
      },
    ],
  },
  ];
}

const CATEGORIES = readingCategories();

/** The page itself or anything below it, but not a look-alike such as /tarotology. */
function isWithin(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The category whose links cover the current page, or null. */
export function currentCategory(pathname: string): ReadingCategory["id"] | null {
  return CATEGORIES.find((category) => category.groups.some((group) => group.links.some((link) => isWithin(pathname, link.href))))?.id ?? null;
}

/** The single link to mark as current: the longest one covering the page, so the dictionary wins over /saju. */
export function currentLinkHref(pathname: string): string | null {
  const hrefs = CATEGORIES.flatMap((category) => category.groups.flatMap((group) => group.links.map((link) => link.href)));
  return hrefs.filter((href) => isWithin(pathname, href)).sort((a, b) => b.length - a.length)[0] ?? null;
}
