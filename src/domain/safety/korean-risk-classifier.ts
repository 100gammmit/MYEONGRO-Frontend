export type HighRiskCategory =
  | "self-harm"
  | "medical"
  | "legal"
  | "investment"
  | "death"
  | "pregnancy"
  | "crime-coercion";

export type RiskAssessment =
  | { highRisk: false; category: null }
  | { highRisk: true; category: HighRiskCategory };

const categoryPatterns: ReadonlyArray<{
  category: HighRiskCategory;
  patterns: readonly RegExp[];
}> = [
  {
    category: "self-harm",
    patterns: [
      /죽고\s*싶/,
      /자살/,
      /자해(를|하고|했|할|충동|하고\s*싶)/,
      /목숨을?\s*(끊|버리)/,
      /스스로\s*(죽|해치)/,
    ],
  },
  {
    category: "medical",
    patterns: [
      /(암|질병|병명|정신질환)\s*(진단|치료)/,
      /암에?\s*(걸린|걸렸|걸린\s*건가|걸렸나)/,
      /약\s*(먹어도|복용해도|먹을까|복용할까|끊어도)/,
      /(수술|치료|약을?|복용).*(해야|말아야|끊어|중단|결정)/,
      /(의사|병원).*(가지\s*말|안\s*가)/,
    ],
  },
  {
    category: "legal",
    patterns: [
      /(고소|소송|재판).*(이길|승소|패소|해야|말아야|할까)/,
      /(변호사|법률).*(선임|상담|조언)/,
      /(형량|처벌|구속|합의금).*(예측|얼마|될까|피할)/,
    ],
  },
  {
    category: "investment",
    patterns: [
      /(대출|빚).*(주식|코인|가상화폐|투자)/,
      /(전부|전재산|몰빵).*(주식|코인|가상화폐|투자)/,
      /(주식|코인|가상화폐).*(매수|매도|사야|팔아야|수익\s*보장)/,
    ],
  },
  {
    category: "death",
    patterns: [
      /(언제|몇\s*살에).*(죽|사망)/,
      /(죽|사망).*(시기|날짜|예측|알려)/,
      /(수명|사망일).*(예측|알려|언제)/,
    ],
  },
  {
    category: "pregnancy",
    patterns: [
      /임신인지/,
      /임신(했을까|했나|한\s*건가|인가|일까)/,
      /임신.*(여부|가능성|확률|맞는지)/,
      /(유산|낙태|태아).*(할지|위험|결정|괜찮)/,
      /출산.*(위험|시기.*결정)/,
    ],
  },
  {
    category: "crime-coercion",
    patterns: [
      /(협박|감금|폭행|스토킹).*(당하|하고|하려|방법|어떻게|대처|신고|피하|멈추|같아)/,
      /강제로/,
      /신고\s*못하게/,
      /(범죄|불법).*(방법|숨기|피하|성공)/,
    ],
  },
];

export function classifyKoreanHighRisk(text: string): RiskAssessment {
  const normalized = text.normalize("NFKC").toLowerCase();

  for (const { category, patterns } of categoryPatterns) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return { highRisk: true, category };
    }
  }

  return { highRisk: false, category: null };
}
