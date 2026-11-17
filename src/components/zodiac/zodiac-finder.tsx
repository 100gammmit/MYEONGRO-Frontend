"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { FINDER_FIRST_YEAR, findZodiacByYear, type YearZodiacAnswer } from "@/domain/zodiac-fortune/years";
import type { ZodiacSlug } from "@/domain/zodiac-fortune/slugs";

import styles from "./zodiac.module.css";

// Only the birth year is asked for, and it stays in this component's memory: nothing is sent,
// stored, logged or written into the address, and the result links carry no birth data.
// Years run newest first, from the content year down to 1900.
export function ZodiacFinder({ signNames, lead, lastYear }: { signNames: Record<ZodiacSlug, string>; lead: string; lastYear: number }) {
  const years = Array.from({ length: lastYear - FINDER_FIRST_YEAR + 1 }, (_, index) => lastYear - index);
  const id = useId();
  const [year, setYear] = useState("");
  const [answer, setAnswer] = useState<YearZodiacAnswer | null>(null);

  return (
    <section aria-labelledby={`${id}-title`} className={styles.finder} id="finder">
      <h2 id={`${id}-title`}>내 띠 찾기</h2>
      <p className={styles.finderLead}>{lead}</p>
      <form
        className={styles.finderForm}
        onSubmit={(event) => {
          event.preventDefault();
          setAnswer(year ? findZodiacByYear(Number(year)) : null);
        }}
      >
        <label htmlFor={`${id}-year`}>태어난 해</label>
        <div className={styles.finderRow}>
          <select id={`${id}-year`} onChange={(event) => {
              setYear(event.target.value);
              setAnswer(null);
            }} value={year}>
            <option value="">태어난 해 선택</option>
            {years.map((value) => <option key={value} value={value}>{value}년</option>)}
          </select>
          <button disabled={!year} type="submit">띠 찾기</button>
        </div>
      </form>
      <div aria-live="polite">
        {answer ? (
          <>
            <ul aria-label={`${answer.year}년생의 띠`} className={styles.finderResult}>
              <li>
                <span>{answer.ipchunMonth}월 {answer.ipchunDay}일(입춘) 이후 출생</span>
                <Link href={`/zodiac/${answer.after}`}><strong>{signNames[answer.after]}</strong></Link>
              </li>
              <li>
                <span>1월 1일 ~ {answer.ipchunMonth}월 {answer.ipchunDay - 1}일 출생</span>
                <Link href={`/zodiac/${answer.before}`}><strong>{signNames[answer.before]}</strong></Link>
              </li>
            </ul>
            <p className={styles.finderNote}>
              {answer.ipchunMonth}월 {answer.ipchunDay}일에 태어났다면 태어난 시각에 따라 달라질 수 있어요.
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
