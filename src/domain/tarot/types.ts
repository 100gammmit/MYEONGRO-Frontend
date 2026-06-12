export type TarotPosition = "past" | "present" | "guidance";

export interface MajorArcanaCard {
  readonly id: string;
  readonly name: string;
  readonly keywords: readonly string[];
  readonly uprightMeaning: string;
  readonly reversedMeaning: string;
}

export interface TarotCardChoice {
  readonly cardId: string;
  readonly reversed: boolean;
}

export interface TarotSpreadCard {
  readonly position: TarotPosition;
  readonly card: MajorArcanaCard;
  readonly reversed: boolean;
}

export interface DemoCardInterpretation {
  readonly position: TarotPosition;
  readonly positionName: string;
  readonly cardId: string;
  readonly cardName: string;
  readonly orientation: "upright" | "reversed";
  readonly orientationName: "정방향" | "역방향";
  readonly keywords: readonly string[];
  readonly interpretation: string;
}

export interface DemoTarotInterpretation {
  readonly title: string;
  readonly overview: string;
  readonly cards: readonly DemoCardInterpretation[];
  readonly guidance: string;
  readonly disclaimer: string;
}
