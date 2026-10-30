"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { FaqGroup } from "@/content/reading-help";
import styles from "./reading-help.module.css";

export function FaqList({ groups }: { groups: readonly FaqGroup[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function openLinkedQuestion() {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (!(target instanceof HTMLDetailsElement) || !root.current?.contains(target)) return;
      target.open = true;
      target.querySelector("summary")?.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start", behavior: "instant" });
    }
    openLinkedQuestion();
    window.addEventListener("hashchange", openLinkedQuestion);
    return () => window.removeEventListener("hashchange", openLinkedQuestion);
  }, []);

  return (
    <div ref={root}>
      {groups.map((group) => (
        <section className={styles.group} id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
          <h2 id={`${group.id}-title`}>{group.title}</h2>
          {group.items.map((item) => (
            <details id={item.id} key={item.id} className={styles.question}>
              <summary>{item.question}</summary>
              <div className={styles.answer}>
                {item.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {item.links && <div className={styles.links}>{item.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>}
                <a href={`#${item.id}`}>이 질문 바로가기</a>
              </div>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
