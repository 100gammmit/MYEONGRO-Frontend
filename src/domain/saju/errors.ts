export class SajuInputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SajuInputValidationError";
  }
}

export class LunarCalendarUnsupportedError extends Error {
  constructor() {
    super(
      "Lunar calendar input is unsupported until a verified conversion dataset is configured.",
    );
    this.name = "LunarCalendarUnsupportedError";
  }
}
