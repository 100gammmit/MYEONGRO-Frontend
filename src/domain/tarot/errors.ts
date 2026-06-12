export type TarotDomainErrorCode =
  | "INVALID_CARD_COUNT"
  | "DUPLICATE_CARD"
  | "UNKNOWN_CARD";

export class TarotDomainError extends Error {
  constructor(
    public readonly code: TarotDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TarotDomainError";
  }
}
