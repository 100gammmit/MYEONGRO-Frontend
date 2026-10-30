import Link from "next/link";
import type { ReadingGuide } from "@/content/reading-help";
import styles from "./reading-help.module.css";

export function ReadingGuidePage({ guide }: { guide: ReadingGuide }) {
  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <p className="eyebrow">READING GUIDE</p>
        <h1>{guide.title}</h1>
        <p>{guide.description}</p>
      </header>
      <section className={styles.summary} aria-labelledby="guide-summary">
        <h2 id="guide-summary">시작 전, 세 가지만 기억하세요</h2>
        <ul>{guide.summary.map((text) => <li key={text}>{text}</li>)}</ul>
      </section>
      <nav className={styles.toc} aria-label="가이드 목차">
        {guide.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
      </nav>
      {guide.sections.map((section) => (
        <section className={styles.section} key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
          <h2 id={`${section.id}-title`}>{section.title}</h2>
          {section.paragraphs.map((text) => <p key={text}>{text}</p>)}
          {section.bullets && <ul>{section.bullets.map((text) => <li key={text}>{text}</li>)}</ul>}
          {section.examples && <>
            <p>다음은 질문 작성 방법을 설명하기 위한 가상 사례입니다. 특정 표현이 더 정확한 결과를 보장하지는 않습니다.</p>
            {section.examples.map((example) => (
              <aside className={styles.example} key={example.title} aria-label={example.title}>
                <h3>{example.title}</h3>
                <dl><dt>짧은 질문</dt><dd>{example.before}</dd><dt>맥락을 보완한 질문</dt><dd>{example.after}</dd></dl>
                <p>{example.note}</p>
              </aside>
            ))}
          </>}
          {section.links && <div className={styles.links}>{section.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>}
        </section>
      ))}
      <section className={styles.related} aria-labelledby="related-title">
        <h2 id="related-title">함께 확인하면 좋은 안내</h2>
        <div className={styles.links}>{guide.related.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
        <div className={styles.links}>
          <Link href="/faq">자주 묻는 질문 전체 보기</Link>
          <Link href={guide.kind === "tarot" ? "/guide/saju" : "/guide/tarot"}>{guide.kind === "tarot" ? "사주" : "타로"} 사용 가이드</Link>
        </div>
      </section>
      <Link className={`primary-button ${styles.start}`} href={`/${guide.kind}`}>{guide.kind === "tarot" ? "타로" : "사주"} 리딩 시작하기</Link>
    </article>
  );
}
