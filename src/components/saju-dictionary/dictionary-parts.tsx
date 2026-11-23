import Link from "next/link";
import type { ReactNode } from "react";

import {
  DICTIONARY,
  DICTIONARY_PATH,
  TEN_GOD_GROUPS,
  TEN_GOD_NAMES,
  TEN_GOD_SLUGS,
  pairOf,
  tenGodPath,
  type DayTenGod,
  type Glyph,
  type TenGodSlug,
} from "@/domain/saju-dictionary";

import styles from "./saju-dictionary.module.css";

export { styles };

export function GlyphText({ glyph }: { glyph: Glyph }) {
  return <span className={styles[glyph.element]}>{glyph.hanja}</span>;
}

export function Breadcrumbs({ trail }: { trail: readonly { label: string; href?: string }[] }) {
  return (
    <nav aria-label="현재 위치">
      <ol className={styles.crumbs}>
        <li><Link href={DICTIONARY_PATH}>사주 개념 사전</Link></li>
        {trail.map((item) => (
          <li className={styles.crumbItem} key={item.label}>
            <span aria-hidden="true" className={styles.crumbSep}>›</span>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface DetailSection {
  readonly id: string;
  readonly title: string;
  readonly body: ReactNode;
}

/** Numbered sections with their table of contents: the detail pages run past four phone screens. */
export function NumberedSections({ sections }: { sections: readonly DetailSection[] }) {
  return (
    <>
      <nav aria-labelledby="dictionary-toc" className={styles.toc}>
        <h2 id="dictionary-toc">목차</h2>
        <ol>
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`}><span aria-hidden="true" className={styles.tocNumber}>{index + 1}</span>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      {sections.map((section, index) => (
        <section aria-labelledby={`${section.id}-title`} className={styles.section} id={section.id} key={section.id}>
          <h2 id={`${section.id}-title`}><span aria-hidden="true" className={styles.sectionNumber}>{index + 1}</span>{section.title}</h2>
          {section.body}
        </section>
      ))}
    </>
  );
}

export function Paragraphs({ items }: { items: readonly string[] }) {
  return <>{items.map((item) => <p key={item}>{item}</p>)}</>;
}

/** Ten chips, one per day stem: what this glyph is to that day stem, each linking to the ten god's page. */
export function DayTenGodChips({ items, current, label }: { items: readonly DayTenGod[]; current?: string; label: string }) {
  return (
    <ul aria-label={label} className={styles.dayChips}>
      {items.map(({ day, tenGod }) => (
        <li className={day.hanja === current ? styles.dayChipCurrent : undefined} key={day.hanja}>
          <span aria-hidden="true" className={`${styles.dayChipGlyph} ${styles[day.element]}`}>{day.hanja}</span>
          <span className={styles.dayChipDay}>{day.korean} 일간</span>
          <Link href={tenGodPath(tenGod)}>{TEN_GOD_NAMES[tenGod]}</Link>
        </li>
      ))}
    </ul>
  );
}

/** The judging table. On a ten god page its cell is marked current and its pair outlined. */
export function JudgeTable({ current }: { current?: TenGodSlug }) {
  const pair = current ? pairOf(current) : undefined;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.judge}>
        <caption className="sr-only">십성 판정표: 일간과 상대 오행의 관계와 음양으로 정해지는 열 가지 십성</caption>
        <thead>
          <tr><th scope="col">일간과 상대 오행의 관계</th><th scope="col">음양이 같으면</th><th scope="col">음양이 다르면</th></tr>
        </thead>
        <tbody>
          {TEN_GOD_GROUPS.map((group, row) => (
            <tr key={group.name}>
              <th scope="row">{group.relation}</th>
              {[TEN_GOD_SLUGS[row * 2], TEN_GOD_SLUGS[row * 2 + 1]].map((slug) => (
                <td key={slug}>
                  <Link aria-current={slug === current ? "page" : undefined} className={slug === pair ? styles.pair : undefined} href={tenGodPath(slug)}>
                    {TEN_GOD_NAMES[slug]}
                  </Link>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The generating and controlling cycle. The legend says the same in words, so the drawing is only an aid. */
export function ElementCycle() {
  return (
    <div className={styles.cycle}>
      <svg aria-hidden="true" className={styles.cycleArt} focusable="false" viewBox="0 0 260 260">
        <defs>
          <marker id="dict-generate" markerHeight="7" markerWidth="7" orient="auto" refX="8" refY="5" viewBox="0 0 10 10"><path d="M0 0L10 5L0 10z" fill="#e8b54a" /></marker>
          <marker id="dict-control" markerHeight="7" markerWidth="7" orient="auto" refX="8" refY="5" viewBox="0 0 10 10"><path d="M0 0L10 5L0 10z" fill="#94bbf5" /></marker>
        </defs>
        <g fill="none" strokeWidth="2">
          <path d="M150 46 Q200 60 210 95" markerEnd="url(#dict-generate)" stroke="#e8b54a" />
          <path d="M222 132 Q220 185 185 205" markerEnd="url(#dict-generate)" stroke="#e8b54a" />
          <path d="M148 222 Q110 232 80 210" markerEnd="url(#dict-generate)" stroke="#e8b54a" />
          <path d="M46 190 Q28 150 42 112" markerEnd="url(#dict-generate)" stroke="#e8b54a" />
          <path d="M60 84 Q80 48 108 44" markerEnd="url(#dict-generate)" stroke="#e8b54a" />
          <g stroke="#94bbf5" strokeDasharray="5 5">
            <path d="M136 64 L166 192" markerEnd="url(#dict-control)" />
            <path d="M158 206 L72 112" markerEnd="url(#dict-control)" />
            <path d="M66 102 L198 108" markerEnd="url(#dict-control)" />
            <path d="M200 118 L86 194" markerEnd="url(#dict-control)" />
            <path d="M92 200 L124 68" markerEnd="url(#dict-control)" />
          </g>
        </g>
        <g fontFamily="Noto Serif KR Variable, serif" fontSize="22" textAnchor="middle">
          <circle cx="130" cy="40" fill="#13231a" r="26" stroke="#7fd3a8" /><text fill="#7fd3a8" x="130" y="48">木</text>
          <circle cx="222" cy="108" fill="#2a1712" r="26" stroke="#f5a394" /><text fill="#f5a394" x="222" y="116">火</text>
          <circle cx="168" cy="214" fill="#2a2212" r="26" stroke="#e8c06a" /><text fill="#e8c06a" x="168" y="222">土</text>
          <circle cx="72" cy="208" fill="#1d2026" r="26" stroke="#dfe4ee" /><text fill="#dfe4ee" x="72" y="216">金</text>
          <circle cx="40" cy="104" fill="#121b2a" r="26" stroke="#94bbf5" /><text fill="#94bbf5" x="40" y="112">水</text>
        </g>
      </svg>
      <ul className={styles.legend}>
        <li><span aria-hidden="true" className={styles.legendLine} />상생 · 목 → 화 → 토 → 금 → 수 → 다시 목</li>
        <li><span aria-hidden="true" className={`${styles.legendLine} ${styles.legendLineDash}`} />상극 · 목 → 토 → 수 → 화 → 금 → 다시 목</li>
      </ul>
    </div>
  );
}

/** The closing block every detail page shares: related reads, the whole set, both starts and the disclaimer. */
export function DetailFooter({ related, browse }: {
  related: readonly { label: string; href: string }[];
  browse: { title: string; items: readonly { label: string; href: string; current: boolean }[] };
}) {
  return (
    <>
      <section aria-labelledby="dictionary-related" className={styles.related}>
        <h2 id="dictionary-related">함께 읽기</h2>
        <ul className={styles.links}>
          {related.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
        </ul>
      </section>
      <nav aria-labelledby="dictionary-browse" className={styles.browse}>
        <h2 id="dictionary-browse">{browse.title}</h2>
        <ul>
          {browse.items.map((item) => (
            <li key={item.href}><Link aria-current={item.current ? "page" : undefined} href={item.href}>{item.label}</Link></li>
          ))}
        </ul>
      </nav>
      <div className={styles.ctas}>
        <Link className="primary-button" href="/manseryeok">무료 만세력으로 내 명식 보기</Link>
        <Link className={styles.ghost} href="/saju">AI 사주 시작하기</Link>
      </div>
      <p className={styles.disclaimer}>{DICTIONARY.disclaimer}</p>
    </>
  );
}
