"use client";

import { useState } from "react";
import type { SajuCalculationSnapshot, SajuEvidenceKey } from "@/domain/saju/result";
import { characters, ELEMENTS, PILLARS, relationInfo, relationCharacterIds, symbolInfo, type Element } from "@/domain/saju/exploration";
import styles from "./saju-calculation-explorer.module.css";

export type ExplorationLink = { id: string; heading: string; evidenceKeys: SajuEvidenceKey[] };

export function SajuCalculationExplorer({ snapshot, links }: { snapshot: SajuCalculationSnapshot; links: ExplorationLink[] }) {
  const [selection, setSelection] = useState<string>("dayMaster");
  const allCharacters = characters(snapshot);
  const element = selection.startsWith("element:") ? selection.slice(8) as Element : undefined;
  const relation = selection.startsWith("relation:") ? snapshot.relations[Number(selection.slice(9))] : undefined;
  const relationDefinition = relation ? relationInfo(relation.type) : undefined;
  const day = snapshot.dayMaster ? symbolInfo(snapshot.dayMaster, "stem") : undefined;
  const dayCharacter = allCharacters.find((character) => character.id === "day-stem");
  const highlighted = element ? allCharacters.filter((character) => character.element === element).map((character) => character.id)
    : relation ? relationCharacterIds(snapshot, relation)
      : day && dayCharacter && symbolInfo(dayCharacter.symbol, "stem")?.korean === day.korean ? [dayCharacter.id] : [];
  const evidence: SajuEvidenceKey = element ? "elementBalance" : relation ? "interactions" : "dayMaster";
  const related = links.filter((link) => link.evidenceKeys.includes(evidence));
  const title = element ? ELEMENTS[element].label : relation ? relationDefinition?.label ?? "저장된 명식 관계" : "일간 · 나를 읽는 기준 글자";

  return <div className={styles.explorer}>
    <p className={styles.intro}>내 사주 탐색 <span>항목을 선택하면 명식의 글자와 설명을 함께 살펴볼 수 있습니다.</span></p>
    <div className={styles.controls} role="group" aria-label="사주 탐색 항목">
      <button type="button" aria-pressed={selection === "dayMaster"} aria-controls="saju-explorer-description" onClick={() => setSelection("dayMaster")}>일간 · 나의 기준</button>
      <div className={styles.groupLabel}>오행 · 글자의 다섯 분류</div>
      {(Object.keys(ELEMENTS) as Element[]).filter((key) => key in snapshot.fiveElements).map((key) => <button key={key} type="button" aria-pressed={element === key} aria-controls="saju-explorer-description" onClick={() => setSelection(`element:${key}`)}>{ELEMENTS[key].label} {snapshot.fiveElements[key]}개</button>)}
      <div className={styles.groupLabel}>명식의 관계 · 글자 사이의 연결</div>
      {snapshot.relations.length ? snapshot.relations.map((value, index) => <button key={index} type="button" aria-pressed={relation === value} aria-controls="saju-explorer-description" onClick={() => setSelection(`relation:${index}`)}>{relationInfo(value.type)?.label ?? "저장된 명식 관계"} ({value.members.join("·")})</button>) : <p>확정된 글자 사이에 저장된 관계가 없습니다. 관계가 없다고 좋거나 나쁜 명식은 아닙니다.</p>}
    </div>
    <div className="saju-pillar-grid">
      {(Object.keys(PILLARS) as (keyof typeof PILLARS)[]).map((key) => {
        const pillar = snapshot.pillars[key];
        if (!pillar) return null;
        const parts = allCharacters.filter((character) => character.pillar === key);
        return <article key={key}>
          <span>{PILLARS[key]}</span>
          <strong aria-label={`${PILLARS[key]} ${pillar.ganZhi}`} className={styles.symbols}>{parts.length ? parts.map((character) => <span key={character.id} className={styles.character} data-highlighted={highlighted.includes(character.id) ? "true" : undefined}>
            {character.symbol}{highlighted.includes(character.id) ? <small className={styles.marker}>선택</small> : null}
          </span>) : pillar.ganZhi}</strong>
          {pillar.stemTenGod ? <small>십성 · {pillar.stemTenGod}</small> : null}
        </article>;
      })}
    </div>
    <div id="saju-explorer-description" className={styles.description} aria-live="polite" aria-atomic="true">
      <h3>{title}</h3>
      {element ? <>
        <p>{ELEMENTS[element].description}</p>
        <p>저장된 구성은 {snapshot.fiveElements[element]}개입니다. 확정된 기둥의 위·아래 글자를 센 값이며, 기운의 강약이나 성격 점수가 아닙니다. 0개여도 결함이나 보완이 필요하다는 뜻은 아닙니다.</p>
        <p>{highlighted.length ? `이 분류에 해당하는 글자 ${highlighted.length}곳을 표시했습니다.` : "현재 표시된 명식에서 이 분류의 글자는 확인되지 않습니다."} 미확정 기둥은 수치와 표시의 해석에서 제외합니다.</p>
      </> : relation ? <>
        <p>{relationDefinition?.description ?? "저장된 관계 이름에 대응하는 설명이 없어 의미나 위치를 추가로 추정하지 않습니다."}</p>
        <p>{highlighted.length ? "저장된 관계의 글자 위치를 표시했습니다." : "저장된 정보만으로 글자의 위치를 특정할 수 없어 강조하지 않았습니다."}</p>
      </> : <>
        <p>일간은 태어난 날을 나타내는 일주의 위 글자입니다. 사주에서는 다른 글자와의 관계를 읽는 기준으로 사용합니다.</p>
        <p>{snapshot.dayMaster ? `이 기록의 일간은 ${snapshot.dayMaster}입니다.${day ? ` 오행에서는 ${ELEMENTS[day.element].label}에 속합니다.` : " 대응 설명이 없어 분류를 추정하지 않습니다."}` : "이 기록은 일간이 확정되지 않아 개인별 설명과 강조를 제공하지 않습니다."} 일간 하나로 성격이나 운명을 정하지 않습니다.</p>
      </>}
      {related.length ? <nav aria-label="선택한 계산을 사용한 리딩"><p>이 계산을 사용한 해석 읽기</p>{related.map((link) => <a key={link.id} href={`#${link.id}`} onClick={() => document.getElementById(link.id)?.focus()}>{link.heading} →</a>)}</nav> : <p>이 항목을 직접 근거로 사용한 리딩 본문은 없습니다.</p>}
    </div>
    <p className={styles.note}>명식은 태어난 시점을 글자로 나타낸 표입니다. 위 글자는 천간, 아래 글자는 지지라고 합니다. 십성은 일간과 다른 글자 사이의 관계를 분류한 이름입니다. 탐색 설명은 전통적인 용어 안내이며 개인별 AI 해석을 추가로 생성하지 않습니다.</p>
  </div>;
}
