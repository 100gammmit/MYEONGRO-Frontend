import "server-only";

import { DAILY_CARD_VARIANT_COUNT, getDailyCardContent } from "./content";
import { MAJOR_ARCANA } from "@/domain/tarot";

// One fixed, unguessable share ID per card and variant. The table never reaches the browser, so a
// link can only be opened by someone it was shared with; the IDs cannot be enumerated from URLs.
// Changing an ID breaks every link already shared for that result: only ever add entries.
const SHARE_IDS: Readonly<Record<string, string>> = {
  "major-00-fool:0": "osWSGvBYg4",
  "major-00-fool:1": "mhcbKrk41s",
  "major-00-fool:2": "AgIvcFzBQt",
  "major-00-fool:3": "KSt1HmxEuu",
  "major-00-fool:4": "zYJT4czWp9",
  "major-00-fool:5": "zNiWBWhjlR",
  "major-01-magician:0": "wNOOtqgFoS",
  "major-01-magician:1": "1coXrch4ZB",
  "major-01-magician:2": "RsKLkS2Ic8",
  "major-01-magician:3": "xcdRRodovh",
  "major-01-magician:4": "iVHEvdpBXL",
  "major-01-magician:5": "91E23fHtJQ",
  "major-02-high-priestess:0": "etMYCKSA5Y",
  "major-02-high-priestess:1": "Yl3GWa1s0S",
  "major-02-high-priestess:2": "kNm3pMJgIb",
  "major-02-high-priestess:3": "xPinPEQXqx",
  "major-02-high-priestess:4": "GMXbtqlcSo",
  "major-02-high-priestess:5": "fQn2PkItRN",
  "major-03-empress:0": "9kfTPkpnpJ",
  "major-03-empress:1": "WSUI2vvv0M",
  "major-03-empress:2": "2Oz6kEU6id",
  "major-03-empress:3": "iAfZLeudb6",
  "major-03-empress:4": "7hAJRZ16or",
  "major-03-empress:5": "zQgZVpKBG8",
  "major-04-emperor:0": "Q7r5ZdeTOO",
  "major-04-emperor:1": "m6qHAl7kQS",
  "major-04-emperor:2": "amZoMPDGkE",
  "major-04-emperor:3": "SsOiB3iiSL",
  "major-04-emperor:4": "8NrGCOPwDV",
  "major-04-emperor:5": "FctyXhTXXO",
  "major-05-hierophant:0": "R2kBz3paWo",
  "major-05-hierophant:1": "ozH8nmUFvs",
  "major-05-hierophant:2": "T72puYC4Fk",
  "major-05-hierophant:3": "0qbR6bhb7y",
  "major-05-hierophant:4": "XIoR8A9ZhC",
  "major-05-hierophant:5": "fTXgJmDWDz",
  "major-06-lovers:0": "QwgOSIBcBi",
  "major-06-lovers:1": "U0KAl5aOma",
  "major-06-lovers:2": "8rlp93IOwh",
  "major-06-lovers:3": "ytghKDpgcC",
  "major-06-lovers:4": "kUpKAaUW8E",
  "major-06-lovers:5": "xaggSbaLNa",
  "major-07-chariot:0": "4dqE0Ssz8p",
  "major-07-chariot:1": "r4dkRPGiGT",
  "major-07-chariot:2": "L0hc6LpIpD",
  "major-07-chariot:3": "1Tz9cCCzi8",
  "major-07-chariot:4": "M6jwFgeBcP",
  "major-07-chariot:5": "DcdItwZakX",
  "major-08-strength:0": "JdjUylFIuN",
  "major-08-strength:1": "3wwpIh2NGr",
  "major-08-strength:2": "3DeG9pzCCP",
  "major-08-strength:3": "3bNZgKvTiV",
  "major-08-strength:4": "CNmEBERPxq",
  "major-08-strength:5": "Vj0M1HNjyf",
  "major-09-hermit:0": "v7XA31ooOG",
  "major-09-hermit:1": "WEhSfCYAIr",
  "major-09-hermit:2": "xw5aBhrEXB",
  "major-09-hermit:3": "EWGlm2BrHw",
  "major-09-hermit:4": "A7GOEUlQ4v",
  "major-09-hermit:5": "KSA5P8xqrm",
  "major-10-wheel-of-fortune:0": "G3NJ8kra4t",
  "major-10-wheel-of-fortune:1": "74RZAI8MWl",
  "major-10-wheel-of-fortune:2": "TMBIaVgFjt",
  "major-10-wheel-of-fortune:3": "T9xjLGD8Je",
  "major-10-wheel-of-fortune:4": "nAPRCztBcL",
  "major-10-wheel-of-fortune:5": "AV2A30i2uS",
  "major-11-justice:0": "ogPrJ0dokD",
  "major-11-justice:1": "iqt2JvWnyq",
  "major-11-justice:2": "3Lk9cICXmG",
  "major-11-justice:3": "fueBFNdXg9",
  "major-11-justice:4": "wFtZZf23qG",
  "major-11-justice:5": "3MOKTV8CGT",
  "major-12-hanged-man:0": "wGJxUC4V4z",
  "major-12-hanged-man:1": "jKoHpkW2Ln",
  "major-12-hanged-man:2": "c6k8grDBHq",
  "major-12-hanged-man:3": "NkvTeZG0yQ",
  "major-12-hanged-man:4": "rO1s4wfwH8",
  "major-12-hanged-man:5": "w6dwjKSeLD",
  "major-13-death:0": "rFJktTYuuE",
  "major-13-death:1": "IsrMBUklnT",
  "major-13-death:2": "nhwRi2u0TD",
  "major-13-death:3": "qipTwHaKVk",
  "major-13-death:4": "sMLRdV5B4W",
  "major-13-death:5": "fWfBfWQply",
  "major-14-temperance:0": "EBxZmMiK5d",
  "major-14-temperance:1": "qhChrILhBm",
  "major-14-temperance:2": "mRqio3HztO",
  "major-14-temperance:3": "L0xDtvWSOp",
  "major-14-temperance:4": "Gj2VF1YK4j",
  "major-14-temperance:5": "rC8059PMpm",
  "major-15-devil:0": "h6x111voGJ",
  "major-15-devil:1": "AVZG1nkC0f",
  "major-15-devil:2": "3TusnE6ymP",
  "major-15-devil:3": "3IPEbVByAt",
  "major-15-devil:4": "kSNCEKjQWA",
  "major-15-devil:5": "btLrsAoIk5",
  "major-16-tower:0": "YgqzvwjCBP",
  "major-16-tower:1": "NkWTltJxMJ",
  "major-16-tower:2": "eTatvILxsK",
  "major-16-tower:3": "LFhKuvROQx",
  "major-16-tower:4": "tqkGprG7BE",
  "major-16-tower:5": "1xi8ffDfZC",
  "major-17-star:0": "pIqTp3iQxk",
  "major-17-star:1": "oEgCL4ymiA",
  "major-17-star:2": "Tts9z7rMTU",
  "major-17-star:3": "vP2m2qkYa2",
  "major-17-star:4": "bhPtuIfSii",
  "major-17-star:5": "19eAByLmrf",
  "major-18-moon:0": "APOYinpxrj",
  "major-18-moon:1": "j681N5mGdT",
  "major-18-moon:2": "qLSYMeEYcq",
  "major-18-moon:3": "v8wbNcigEO",
  "major-18-moon:4": "ioy742vZJ0",
  "major-18-moon:5": "cOV9eCdVA1",
  "major-19-sun:0": "4I3xCfnMU3",
  "major-19-sun:1": "lQiqFb34Oj",
  "major-19-sun:2": "gzul6DIIgN",
  "major-19-sun:3": "rO3QfVZQzG",
  "major-19-sun:4": "FFDuNH6zYV",
  "major-19-sun:5": "G3It2njtqS",
  "major-20-judgement:0": "YRHHimmvKI",
  "major-20-judgement:1": "JpcAEjJ9Ug",
  "major-20-judgement:2": "6qPea26iRw",
  "major-20-judgement:3": "KaxdTo3j1P",
  "major-20-judgement:4": "O4IlnKyUzQ",
  "major-20-judgement:5": "ogKg6EtX3Z",
  "major-21-world:0": "Pf5f0M89OV",
  "major-21-world:1": "eCb3JmWQXX",
  "major-21-world:2": "V25gEjmE0J",
  "major-21-world:3": "92PorPaMzC",
  "major-21-world:4": "rbuw2aH0lQ",
  "major-21-world:5": "ulKSBTvVIO",
};

export interface DailyCardShareTarget {
  readonly cardId: string;
  readonly variantIndex: number;
}

const SHARE_ID_PATTERN = /^[A-Za-z0-9]{10}$/;
// A Map keeps lookups off the object prototype ("constructor:0" and the like).
const idsByKey = new Map(Object.entries(SHARE_IDS));
const targetsById = new Map<string, DailyCardShareTarget>();

for (const [key, id] of Object.entries(SHARE_IDS)) {
  const [cardId, variant] = key.split(":");
  const variantIndex = Number(variant);
  if (!SHARE_ID_PATTERN.test(id) || targetsById.has(id) || !getDailyCardContent(cardId, variantIndex)) {
    throw new Error("오늘의 카드 공유 ID 구성이 올바르지 않습니다.");
  }
  targetsById.set(id, { cardId, variantIndex });
}
for (const card of MAJOR_ARCANA) {
  for (let variantIndex = 0; variantIndex < DAILY_CARD_VARIANT_COUNT; variantIndex += 1) {
    if (!idsByKey.has(`${card.id}:${variantIndex}`)) {
      throw new Error("오늘의 카드 공유 ID가 누락되었습니다.");
    }
  }
}

export const DAILY_CARD_SHARE_IDS: readonly string[] = [...targetsById.keys()];

export function dailyCardShareId(cardId: string, variantIndex: number): string | null {
  return idsByKey.get(`${cardId}:${variantIndex}`) ?? null;
}

export function dailyCardFromShareId(id: string): DailyCardShareTarget | null {
  return targetsById.get(id) ?? null;
}

export function dailyCardSharePath(id: string): string {
  return `/tarot/daily/${id}`;
}
