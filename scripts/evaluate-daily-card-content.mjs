import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(
  root,
  "src/domain/daily-card-free/content/daily-one-card-static-v1.json",
);
const outputDirectory = resolve(root, "build/daily-card-content-evaluation");
const items = JSON.parse(await readFile(source, "utf8"));

const CARD_NAMES = new Map([
  ["major-00-fool", "바보"], ["major-01-magician", "마법사"],
  ["major-02-high-priestess", "여사제"], ["major-03-empress", "여제"],
  ["major-04-emperor", "황제"], ["major-05-hierophant", "교황"],
  ["major-06-lovers", "연인"], ["major-07-chariot", "전차"],
  ["major-08-strength", "힘"], ["major-09-hermit", "은둔자"],
  ["major-10-wheel-of-fortune", "운명의 수레바퀴"],
  ["major-11-justice", "정의"], ["major-12-hanged-man", "매달린 사람"],
  ["major-13-death", "죽음"], ["major-14-temperance", "절제"],
  ["major-15-devil", "악마"], ["major-16-tower", "탑"],
  ["major-17-star", "별"], ["major-18-moon", "달"],
  ["major-19-sun", "태양"], ["major-20-judgement", "심판"],
  ["major-21-world", "세계"],
]);

const ABSTRACT_WORDS = /흐름|에너지|기반|가능성|기준|힘|속도|안정/g;
const COMMAND_WORDS = /하세요|마세요|하십시오|반드시|해야 합니다|해야 해요/g;
const ACTION_HEADINGS = /해봐요|나눠봐요|살펴봐요/g;
const TYPO_WORDS = /잇는/g;
const AWKWARD_PROPOSALS = /괜찮아요\?/g;
const SAFETY_WORDS = /사망|임신|질병|파산|범죄|수술|투자|약을?\s*중단|계약을?\s*(체결|해지)/g;
const SYMBOL_WORDS = /처럼|장면|모습|상징|빛|그림자|손|발|잔|검|지팡이|수레바퀴|절벽|별빛|달빛|태양|왕좌|저울|사슬|탑/g;
const DIRECTION_WORDS = /열리|풀리|이어|커지|줄어|더디|지연|부담|흔들|엇갈|주의|선명|가벼|무거|막히|좋|어렵|수월/g;
const PROPOSAL_ENDINGS = /어때요\?|좋아요[.!]?|괜찮아요[.!]?$/;

const byCard = Map.groupBy(items, (item) => item.cardId);
const evaluations = items.map((item) => evaluate(item, byCard.get(item.cardId) ?? []));
evaluations.sort((left, right) => right.score - left.score
  || left.cardId.localeCompare(right.cardId)
  || left.variantIndex - right.variantIndex);

const summary = {
  total: evaluations.length,
  average: round(average(evaluations.map((item) => item.score))),
  median: median(evaluations.map((item) => item.score)),
  minimum: Math.min(...evaluations.map((item) => item.score)),
  maximum: Math.max(...evaluations.map((item) => item.score)),
  ready: evaluations.filter((item) => item.filter === "ready").length,
  review: evaluations.filter((item) => item.filter === "review").length,
  filtered: evaluations.filter((item) => item.filter === "filtered").length,
  safetyFlags: evaluations.filter((item) => item.flags.some((flag) => flag.startsWith("safety:"))).length,
  commandFlags: evaluations.filter((item) => item.flags.includes("command-tone")).length,
  missingCardEvidence: evaluations.filter((item) => item.flags.includes("missing-card-name")).length,
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "evaluation.json"),
  `${JSON.stringify({ summary, evaluations }, null, 2)}\n`,
  "utf8",
);
await writeFile(
  resolve(outputDirectory, "evaluation.md"),
  markdown(summary, evaluations),
  "utf8",
);

console.log(JSON.stringify(summary, null, 2));
console.log(`Report: ${resolve(outputDirectory, "evaluation.md")}`);

function evaluate(item, peers) {
  const title = item.title?.trim() ?? "";
  const heading = item.today?.heading?.trim() ?? "";
  const body = item.today?.body?.trim() ?? "";
  const guidance = Array.isArray(item.guidance) ? item.guidance : [];
  const guidanceText = guidance[0]?.trim() ?? "";
  const disclaimer = item.disclaimer?.trim() ?? "";
  const userText = [title, heading, body, guidanceText, disclaimer].join(" ");
  const sentences = body.split(/[.!?]+/).map((value) => value.trim()).filter(Boolean);
  const cardName = CARD_NAMES.get(item.cardId) ?? "";
  const cardNameCount = occurrences(body, cardName);
  const peerSimilarities = peers
    .filter((peer) => peer.variantIndex !== item.variantIndex)
    .map((peer) => similarity(body, peer.today?.body ?? ""));
  const maximumSimilarity = peerSimilarities.length > 0 ? Math.max(...peerSimilarities) : 0;
  const flags = [];
  const safetyMatches = matches(userText, SAFETY_WORDS);
  for (const match of safetyMatches) flags.push(`safety:${match}`);
  if (COMMAND_WORDS.test(userText)) flags.push("command-tone");
  COMMAND_WORDS.lastIndex = 0;
  if (ACTION_HEADINGS.test(heading)) flags.push("action-heading");
  ACTION_HEADINGS.lastIndex = 0;
  if (TYPO_WORDS.test(userText)) flags.push("known-typo");
  TYPO_WORDS.lastIndex = 0;
  if (AWKWARD_PROPOSALS.test(guidanceText)) flags.push("awkward-proposal");
  AWKWARD_PROPOSALS.lastIndex = 0;
  if (cardNameCount === 0) flags.push("missing-card-name");
  if (guidance.length !== 1) flags.push("guidance-count");

  let structure = 0;
  structure += between(title.length, 6, 30) ? 4 : 2;
  structure += between(heading.length, 6, 35) ? 4 : 2;
  structure += between(sentences.length, 2, 3) ? 6 : 0;
  structure += guidance.length === 1 && between(guidanceText.length, 12, 60) ? 6 : 0;

  const abstractCount = matches(userText, ABSTRACT_WORDS).length;
  let clarity = 0;
  clarity += between(body.length, 70, 220) ? 5 : 2;
  clarity += Math.max(...sentences.map((sentence) => sentence.length), 0) <= 110 ? 5 : 2;
  clarity += abstractCount <= 4 ? 5 : abstractCount <= 6 ? 3 : 0;
  clarity += /[A-Za-z\u4E00-\u9FFF]/.test(userText) ? 0 : 5;

  let tone = 0;
  tone += sentences.every((sentence) => /요$/.test(sentence)) && /요[.?!]?$/.test(guidanceText) ? 6 : 2;
  tone += flags.includes("command-tone") ? 0 : 8;
  tone += PROPOSAL_ENDINGS.test(guidanceText) ? 6 : 2;

  let evidence = 0;
  evidence += cardNameCount === 1 ? 10 : cardNameCount > 1 ? 5 : 0;
  evidence += SYMBOL_WORDS.test(body) ? 6 : 0;
  SYMBOL_WORDS.lastIndex = 0;
  evidence += DIRECTION_WORDS.test(sentences[0] ?? "") ? 4 : 1;
  DIRECTION_WORDS.lastIndex = 0;

  let variety = 0;
  variety += maximumSimilarity <= 0.55 ? 12 : maximumSimilarity <= 0.65 ? 8 : maximumSimilarity <= 0.75 ? 4 : 0;
  variety += isUnique(item, peers, "title") ? 3 : 0;
  variety += isUnique(item, peers, "heading") ? 2 : 0;
  variety += peers.filter((peer) => peer.guidance?.[0] === guidanceText).length === 1 ? 3 : 0;

  const score = structure + clarity + tone + evidence + variety;
  const hasHardFlag = flags.some((flag) => flag.startsWith("safety:"))
    || flags.includes("command-tone")
    || flags.includes("action-heading")
    || flags.includes("known-typo")
    || flags.includes("awkward-proposal")
    || flags.includes("missing-card-name")
    || flags.includes("guidance-count");
  const filter = !hasHardFlag && score >= 85
    ? "ready"
    : !hasHardFlag && score >= 75
      ? "review"
      : "filtered";

  return {
    cardId: item.cardId,
    cardName,
    variantIndex: item.variantIndex,
    score,
    filter,
    dimensions: { structure, clarity, tone, evidence, variety },
    metrics: { bodyLength: body.length, sentenceCount: sentences.length, abstractCount, maximumSimilarity: round(maximumSimilarity) },
    flags,
    title,
    heading,
    body,
    guidance: guidanceText,
  };
}

function isUnique(item, peers, field) {
  return peers.filter((peer) => peer[field] === item[field]).length === 1;
}

function occurrences(text, target) {
  if (!target) return 0;
  return text.split(target).length - 1;
}

function matches(text, pattern) {
  pattern.lastIndex = 0;
  return [...text.matchAll(pattern)].map((match) => match[0]);
}

function similarity(left, right) {
  const leftNgrams = ngrams(left);
  const rightNgrams = ngrams(right);
  const union = new Set([...leftNgrams, ...rightNgrams]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const value of leftNgrams) if (rightNgrams.has(value)) intersection += 1;
  return intersection / union.size;
}

function ngrams(text) {
  const normalized = text.replace(/[^가-힣0-9]/g, "");
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}

function between(value, minimum, maximum) {
  return value >= minimum && value <= maximum;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function markdown(summary, evaluations) {
  const rows = evaluations.map((item, index) => [
    index + 1,
    item.score,
    item.filter,
    item.cardName,
    item.variantIndex,
    item.title.replaceAll("|", "\\|"),
    item.flags.join(", ") || "-",
  ].join(" | "));
  return `# 오늘의 한 장 정적 콘텐츠 평가\n\n`
    + `- 전체: ${summary.total}\n`
    + `- 평균/중앙값: ${summary.average} / ${summary.median}\n`
    + `- 최저/최고: ${summary.minimum} / ${summary.maximum}\n`
    + `- ready/review/filtered: ${summary.ready} / ${summary.review} / ${summary.filtered}\n`
    + `- 안전 플래그: ${summary.safetyFlags}\n`
    + `- 명령조 플래그: ${summary.commandFlags}\n`
    + `- 카드 이름 근거 누락: ${summary.missingCardEvidence}\n\n`
    + `순위 | 점수 | 분류 | 카드 | 변형 | 제목 | 플래그\n`
    + `---: | ---: | --- | --- | ---: | --- | ---\n`
    + `${rows.join("\n")}\n`;
}
