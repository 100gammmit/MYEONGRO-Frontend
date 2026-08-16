export type BirthTimePrecision = "exact" | "approximate" | "unknown";
export type LuckDirectionBasis = "male" | "female" | "unspecified";
export type SajuFocusArea = "self" | "career" | "relationship" | "life_money";

export interface SajuBirthPlaceCity {
  readonly cityCode: string;
  readonly cityName: string;
}

export interface SajuBirthPlaceProvince {
  readonly provinceCode: string;
  readonly provinceName: string;
  readonly cities: readonly SajuBirthPlaceCity[];
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
  readonly provinceCode: string;
  readonly cityCode: string;
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
    readonly schemaVersion: 2;
    readonly status: "generating" | "completed" | "failed";
  };
}

export interface SajuApiError {
  readonly code: string;
  readonly field?: string;
  readonly message: string;
}
