export type BirthTimePrecision = "exact" | "approximate" | "unknown";
export type LuckDirectionBasis = "male" | "female" | "unspecified";
export type SajuFocusArea = "self" | "career" | "relationship" | "life_money";

export interface SajuBirthPlaceProvince {
  readonly provinceCode: string;
  readonly provinceName: string;
}

export interface SajuBirthPlacesResponse {
  readonly version: string;
  readonly provinces: readonly SajuBirthPlaceProvince[];
}

export interface SajuBirthProfile {
  readonly calendarType: "solar";
  readonly birthDate: string;
  readonly birthTimePrecision: BirthTimePrecision;
  readonly birthTime?: string;
  readonly provinceCode?: string;
  readonly luckDirectionBasis: LuckDirectionBasis;
}

export interface SajuReadingCreateRequest {
  readonly requestId: string;
  readonly question: string;
  readonly focusArea: SajuFocusArea;
  readonly birthProfile: SajuBirthProfile;
}

export interface SajuReadingCreatedResponse {
  readonly reading: {
    readonly id: string;
    readonly kind: "saju";
    readonly schemaVersion: 3;
    readonly status: "generating" | "completed" | "failed";
  };
}

export interface SajuApiError {
  readonly code: string;
  readonly field?: string;
  readonly message: string;
}
