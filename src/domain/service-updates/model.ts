export type ServiceUpdateCategory =
  | "release"
  | "policy"
  | "credit"
  | "service"
  | "emergency";

export type ServiceUpdateNoticeLevel =
  | "routine"
  | "general"
  | "adverse"
  | "emergency";

export type ServiceUpdateLink = Readonly<{
  label: string;
  href: string;
}>;

export type ServiceUpdate = Readonly<{
  id: string;
  category: ServiceUpdateCategory;
  noticeLevel: ServiceUpdateNoticeLevel;
  title: string;
  summary: string;
  changes: readonly string[];
  publishedDate: string;
  effectiveDate: string;
  links?: readonly ServiceUpdateLink[];
  correctionOf?: string;
  emergencyReason?: string;
}>;

export const SERVICE_UPDATE_CATEGORY_LABELS: Readonly<Record<ServiceUpdateCategory, string>> = {
  release: "기능 업데이트",
  policy: "정책 변경",
  credit: "크레딧 변경",
  service: "서비스 안내",
  emergency: "긴급 안내",
};

export const SERVICE_UPDATE_NOTICE_LABELS: Readonly<Record<ServiceUpdateNoticeLevel, string>> = {
  routine: "업데이트",
  general: "중요 안내",
  adverse: "중요 변경",
  emergency: "긴급 안내",
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY_IN_MILLISECONDS = 86_400_000;

export function defineServiceUpdates<const T extends readonly ServiceUpdate[]>(
  updates: T,
): T {
  validateServiceUpdates(updates);
  return updates;
}

export function validateServiceUpdates(updates: readonly ServiceUpdate[]): void {
  const seenIds = new Set<string>();
  const updatesById = new Map(updates.map((update) => [update.id, update]));
  const indexesById = new Map(updates.map((update, index) => [update.id, index]));
  const correctedTargets = new Set<string>();

  for (const [index, update] of updates.entries()) {
    if (!ID_PATTERN.test(update.id)) {
      throw new Error(`Service update id must be anchor-safe: ${update.id}`);
    }
    if (seenIds.has(update.id)) {
      throw new Error(`Duplicate service update id: ${update.id}`);
    }
    seenIds.add(update.id);

    if (!update.title.trim() || !update.summary.trim() || update.changes.length === 0) {
      throw new Error(`Service update content is incomplete: ${update.id}`);
    }
    if (update.changes.some((change) => !change.trim())) {
      throw new Error(`Service update contains an empty change: ${update.id}`);
    }

    const publishedDay = parseKoreaDate(update.publishedDate);
    const effectiveDay = parseKoreaDate(update.effectiveDate);
    const leadDays = Math.round((effectiveDay - publishedDay) / DAY_IN_MILLISECONDS);
    if (leadDays < 0) {
      throw new Error(`Service update is effective before publication: ${update.id}`);
    }
    if (update.noticeLevel === "general" && leadDays < 7) {
      throw new Error(`General service update needs at least 7 days notice: ${update.id}`);
    }
    if (update.noticeLevel === "adverse" && leadDays < 30) {
      throw new Error(`Adverse service update needs at least 30 days notice: ${update.id}`);
    }
    if (update.noticeLevel === "emergency" && !update.emergencyReason?.trim()) {
      throw new Error(`Emergency service update needs a reason: ${update.id}`);
    }
    if (update.noticeLevel === "emergency" && leadDays !== 0) {
      throw new Error(`Emergency service update must be published on its effective date: ${update.id}`);
    }
    if ((update.noticeLevel === "emergency") !== (update.category === "emergency")) {
      throw new Error(`Emergency service update category and level must match: ${update.id}`);
    }
    if (update.noticeLevel !== "emergency" && update.emergencyReason !== undefined) {
      throw new Error(`Only emergency service updates may include a reason: ${update.id}`);
    }

    for (const link of update.links ?? []) {
      if (!link.label.trim() || !link.href.trim()) {
        throw new Error(`Service update contains an incomplete link: ${update.id}`);
      }
    }

    if (update.correctionOf) {
      const original = updatesById.get(update.correctionOf);
      if (!original || original.id === update.id) {
        throw new Error(`Service update correction target does not exist: ${update.id}`);
      }
      if ((indexesById.get(original.id) ?? index) >= index) {
        throw new Error(`Service update correction must follow its target: ${update.id}`);
      }
      if (correctedTargets.has(original.id)) {
        throw new Error(`Service update target already has a correction: ${original.id}`);
      }
      correctedTargets.add(original.id);
      if (compareKoreaDates(update.publishedDate, original.publishedDate) < 0) {
        throw new Error(`Service update correction predates its target: ${update.id}`);
      }
    }
  }
}

export function koreaDateFromInstant(instant = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function millisecondsUntilNextKoreaDate(instant = new Date()): number {
  const nextDate = addKoreaCalendarDays(koreaDateFromInstant(instant), 1);
  const nextMidnight = new Date(`${nextDate}T00:00:00+09:00`).getTime();
  return Math.max(nextMidnight - instant.getTime(), 1);
}

export function getPublishedServiceUpdates(
  updates: readonly ServiceUpdate[],
  today = koreaDateFromInstant(),
): readonly ServiceUpdate[] {
  parseKoreaDate(today);
  const published = updates.filter(
    (update) => compareKoreaDates(update.publishedDate, today) <= 0,
  );
  const upcoming = published
    .filter((update) => compareKoreaDates(update.effectiveDate, today) > 0)
    .sort((left, right) => (
      compareKoreaDates(left.effectiveDate, right.effectiveDate)
      || compareKoreaDates(right.publishedDate, left.publishedDate)
      || left.id.localeCompare(right.id)
    ));
  const applied = published
    .filter((update) => compareKoreaDates(update.effectiveDate, today) <= 0)
    .sort((left, right) => (
      compareKoreaDates(right.effectiveDate, left.effectiveDate)
      || compareKoreaDates(right.publishedDate, left.publishedDate)
      || left.id.localeCompare(right.id)
    ));
  return [...upcoming, ...applied];
}

export function getActiveImportantServiceUpdates(
  updates: readonly ServiceUpdate[],
  today = koreaDateFromInstant(),
): readonly ServiceUpdate[] {
  parseKoreaDate(today);
  const priority: Readonly<Record<ServiceUpdateNoticeLevel, number>> = {
    emergency: 0,
    adverse: 1,
    general: 2,
    routine: 3,
  };

  return updates
    .filter((update) => (
      update.noticeLevel !== "routine"
      && compareKoreaDates(update.publishedDate, today) <= 0
      && compareKoreaDates(today, addKoreaCalendarDays(update.effectiveDate, 7)) <= 0
    ))
    .sort((left, right) => (
      priority[left.noticeLevel] - priority[right.noticeLevel]
      || compareKoreaDates(left.effectiveDate, right.effectiveDate)
      || left.id.localeCompare(right.id)
    ));
}

export function getServiceUpdateStatus(
  update: ServiceUpdate,
  today = koreaDateFromInstant(),
): "upcoming" | "applied" {
  return compareKoreaDates(update.effectiveDate, today) > 0 ? "upcoming" : "applied";
}

export function findServiceUpdateCorrection(
  updates: readonly ServiceUpdate[],
  originalId: string,
): ServiceUpdate | undefined {
  return updates.find((update) => update.correctionOf === originalId);
}

export function formatKoreaDate(date: string): string {
  parseKoreaDate(date);
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function compareKoreaDates(left: string, right: string): number {
  return parseKoreaDate(left) - parseKoreaDate(right);
}

function addKoreaCalendarDays(date: string, days: number): string {
  const instant = new Date(parseKoreaDate(date) + days * DAY_IN_MILLISECONDS);
  return [
    instant.getUTCFullYear(),
    String(instant.getUTCMonth() + 1).padStart(2, "0"),
    String(instant.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function parseKoreaDate(value: string): number {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`Invalid Korea calendar date: ${value}`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid Korea calendar date: ${value}`);
  }
  return timestamp;
}
