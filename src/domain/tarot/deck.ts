export interface MajorArcanaCard {
  readonly id: string;
  readonly name: string;
  readonly keywords: readonly string[];
  readonly uprightMeaning: string;
  readonly reversedMeaning: string;
}

export const MAJOR_ARCANA = [
  {
    id: "major-00-fool",
    name: "바보",
    keywords: ["새로운 시작", "자유", "순수한 가능성"],
    uprightMeaning:
      "익숙한 경계를 넘어 새로운 가능성을 믿고 첫걸음을 내딛을 때입니다.",
    reversedMeaning:
      "충동적인 선택이나 준비 부족을 점검하고 한 걸음 신중하게 나아가야 합니다.",
  },
  {
    id: "major-01-magician",
    name: "마법사",
    keywords: ["의지", "창조", "실행력"],
    uprightMeaning:
      "이미 가진 재능과 자원을 집중하면 원하는 변화를 현실로 만들 수 있습니다.",
    reversedMeaning:
      "능력이 분산되거나 의도가 흐려질 수 있으니 말과 행동의 일치를 살펴야 합니다.",
  },
  {
    id: "major-02-high-priestess",
    name: "여사제",
    keywords: ["직관", "내면", "숨은 지혜"],
    uprightMeaning:
      "겉으로 드러난 정보보다 조용한 직관과 내면의 목소리를 신뢰할 때입니다.",
    reversedMeaning:
      "불안이나 선입견이 직관을 가릴 수 있으니 사실과 감정을 차분히 구분해야 합니다.",
  },
  {
    id: "major-03-empress",
    name: "여제",
    keywords: ["풍요", "돌봄", "성장"],
    uprightMeaning:
      "따뜻한 돌봄과 꾸준한 투자가 관계와 계획을 풍성하게 성장시킵니다.",
    reversedMeaning:
      "지나친 희생이나 정체된 성장을 돌아보고 자신을 돌보는 균형이 필요합니다.",
  },
  {
    id: "major-04-emperor",
    name: "황제",
    keywords: ["질서", "책임", "안정"],
    uprightMeaning:
      "분명한 기준과 책임 있는 태도가 흔들리는 상황에 안정적인 틀을 세웁니다.",
    reversedMeaning:
      "과도한 통제나 완고함을 내려놓고 다른 관점과 유연하게 협력해야 합니다.",
  },
  {
    id: "major-05-hierophant",
    name: "교황",
    keywords: ["전통", "배움", "신념"],
    uprightMeaning:
      "검증된 지혜와 믿을 만한 조언을 통해 현재의 선택에 기준을 세울 수 있습니다.",
    reversedMeaning:
      "낡은 관습을 그대로 따르기보다 자신에게 진실한 가치가 무엇인지 재검토해야 합니다.",
  },
  {
    id: "major-06-lovers",
    name: "연인",
    keywords: ["관계", "조화", "가치 선택"],
    uprightMeaning:
      "진솔한 소통과 가치의 일치가 중요한 관계나 선택을 조화롭게 이끕니다.",
    reversedMeaning:
      "엇갈린 기대와 회피한 선택을 직면하고 관계의 기준을 다시 맞춰야 합니다.",
  },
  {
    id: "major-07-chariot",
    name: "전차",
    keywords: ["전진", "의지", "방향성"],
    uprightMeaning:
      "상반된 힘을 한 방향으로 모으면 장애물을 넘어 목표를 향해 전진할 수 있습니다.",
    reversedMeaning:
      "속도보다 방향을 먼저 확인하고 무리한 추진이나 감정적 경쟁을 멈춰야 합니다.",
  },
  {
    id: "major-08-strength",
    name: "힘",
    keywords: ["용기", "인내", "부드러운 통제"],
    uprightMeaning:
      "강압보다 인내와 다정한 용기가 어려운 상황을 다룰 진정한 힘이 됩니다.",
    reversedMeaning:
      "자신감 저하나 억눌린 감정을 인정하고 작은 회복부터 시작할 필요가 있습니다.",
  },
  {
    id: "major-09-hermit",
    name: "은둔자",
    keywords: ["성찰", "탐구", "내면의 빛"],
    uprightMeaning:
      "잠시 소음을 벗어나 깊이 성찰하면 다음 길을 밝힐 답을 발견할 수 있습니다.",
    reversedMeaning:
      "고립이 길어지지 않도록 믿을 만한 사람과 생각을 나누며 현실로 돌아와야 합니다.",
  },
  {
    id: "major-10-wheel-of-fortune",
    name: "운명의 수레바퀴",
    keywords: ["변화", "순환", "전환점"],
    uprightMeaning:
      "새로운 흐름과 뜻밖의 기회가 찾아오니 변화의 리듬을 유연하게 받아들일 때입니다.",
    reversedMeaning:
      "통제하기 어려운 지연이나 반복되는 패턴을 인정하고 대응 방식을 바꿔야 합니다.",
  },
  {
    id: "major-11-justice",
    name: "정의",
    keywords: ["균형", "진실", "책임"],
    uprightMeaning:
      "감정과 사실을 함께 살피는 공정한 판단이 책임 있는 결과로 이어집니다.",
    reversedMeaning:
      "편견이나 책임 회피가 없는지 점검하고 불균형한 부분을 바로잡아야 합니다.",
  },
  {
    id: "major-12-hanged-man",
    name: "매달린 사람",
    keywords: ["멈춤", "관점 전환", "내려놓음"],
    uprightMeaning:
      "서두르지 않고 관점을 뒤집어 보면 멈춤 속에서 새로운 의미가 드러납니다.",
    reversedMeaning:
      "의미 없는 희생이나 미루기를 끝내고 바꿀 수 있는 것부터 행동해야 합니다.",
  },
  {
    id: "major-13-death",
    name: "죽음",
    keywords: ["마무리", "변환", "재탄생"],
    uprightMeaning:
      "끝나야 할 것을 정리할수록 새로운 단계가 들어올 공간이 열립니다.",
    reversedMeaning:
      "익숙한 것에 대한 집착이 변화를 늦추고 있으니 작은 이별부터 받아들여야 합니다.",
  },
  {
    id: "major-14-temperance",
    name: "절제",
    keywords: ["조화", "회복", "균형"],
    uprightMeaning:
      "극단을 피하고 서로 다른 요소를 천천히 조율하면 안정적인 회복이 이루어집니다.",
    reversedMeaning:
      "생활과 감정의 불균형을 알아차리고 과하거나 부족한 부분을 조절해야 합니다.",
  },
  {
    id: "major-15-devil",
    name: "악마",
    keywords: ["집착", "유혹", "그림자"],
    uprightMeaning:
      "욕망과 두려움이 만든 속박을 정직하게 바라보면 선택권을 되찾을 수 있습니다.",
    reversedMeaning:
      "해로운 습관과 관계의 고리를 끊을 힘이 생기며 자유를 향한 변화가 시작됩니다.",
  },
  {
    id: "major-16-tower",
    name: "탑",
    keywords: ["충격", "해체", "진실의 드러남"],
    uprightMeaning:
      "갑작스러운 변화가 불안정한 기반을 무너뜨리지만 더 정직한 재건을 가능하게 합니다.",
    reversedMeaning:
      "피해 온 변화를 더 미루지 말고 작은 균열부터 안전하게 수리해야 합니다.",
  },
  {
    id: "major-17-star",
    name: "별",
    keywords: ["희망", "치유", "영감"],
    uprightMeaning:
      "상처 뒤에 맑은 희망이 되살아나며 진솔한 바람이 앞으로의 길을 비춥니다.",
    reversedMeaning:
      "낙담으로 가능성을 놓치지 않도록 작은 희망의 근거와 회복의 리듬을 찾아야 합니다.",
  },
  {
    id: "major-18-moon",
    name: "달",
    keywords: ["불확실성", "감수성", "무의식"],
    uprightMeaning:
      "모호한 상황에서는 감정을 존중하되 확인되지 않은 두려움을 사실로 단정하지 마세요.",
    reversedMeaning:
      "혼란의 안개가 걷히기 시작하니 숨겨진 사실과 감정을 차분히 확인할 때입니다.",
  },
  {
    id: "major-19-sun",
    name: "태양",
    keywords: ["활력", "성공", "명료함"],
    uprightMeaning:
      "분명한 자신감과 따뜻한 에너지가 성취와 기쁨을 주변과 나누게 합니다.",
    reversedMeaning:
      "성과를 과소평가하거나 낙관에 치우치지 말고 현실적인 기쁨을 다시 발견해야 합니다.",
  },
  {
    id: "major-20-judgement",
    name: "심판",
    keywords: ["각성", "성찰", "새로운 부름"],
    uprightMeaning:
      "과거를 정직하게 돌아본 뒤 더 큰 의미에 응답하는 새로운 결정을 내릴 때입니다.",
    reversedMeaning:
      "자기비판이나 후회에 머물지 말고 배운 점을 바탕으로 자신을 용서해야 합니다.",
  },
  {
    id: "major-21-world",
    name: "세계",
    keywords: ["완성", "통합", "성취"],
    uprightMeaning:
      "한 주기가 충실히 완성되며 경험들이 하나로 연결되는 성취를 맞이합니다.",
    reversedMeaning:
      "마무리되지 않은 세부 사항을 정돈해야 다음 단계로 온전히 넘어갈 수 있습니다.",
  },
] as const satisfies readonly MajorArcanaCard[];
