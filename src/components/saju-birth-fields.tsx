"use client";

import { useState, type ChangeEvent } from "react";

import type { BirthTimePrecision, LuckDirectionBasis, SajuBirthPlacesResponse } from "@/domain/saju/contracts";
import {
  calculationOptionsSummary,
  isBirthTimeKnown,
  withProvince,
  type SajuBirthFieldKey,
  type SajuBirthValues,
} from "@/domain/saju/birth-input";

import { birthDateConfirmation, birthDateProblem, birthDateProblemMessage, countDigits, formatBirthDateInput } from "@/domain/saju/birth-date";

import { FieldError } from "./field-error";
import styles from "./saju-birth-fields.module.css";

export type BirthPlaceCatalogStatus = "idle" | "loading" | "ready" | "error";

const PRECISION_OPTIONS: ReadonlyArray<{ value: BirthTimePrecision; label: string; detail: string }> = [
  { value: "exact", label: "정확히 알아요", detail: "몇 시 몇 분까지 알아요" },
  { value: "approximate", label: "대략 알아요", detail: "몇 시쯤인지만 알아요" },
  { value: "unknown", label: "몰라요", detail: "생일만 알아요" },
];

const LUCK_OPTIONS: ReadonlyArray<{ value: LuckDirectionBasis; label: string }> = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "unspecified", label: "선택하지 않음" },
];

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

const TIME_PLACE_HELP: Record<SajuBirthValues["birthTimePrecision"], string> = {
  "": "태어난 시각이 확실하지 않다면 ‘대략 알아요’나 ‘몰라요’를 골라 주세요.",
  exact: "태어난 곳의 경도로 시각을 보정해요. 시·군·구는 고르지 않아도 되고, 그러면 시·도 기준으로 계산해요.",
  approximate: "고른 시의 정각을 기준으로 앞뒤 60분을 함께 살펴보고, 그 안에서 갈리는 기둥은 확정하지 않아요. 시·군·구는 고르지 않아도 돼요.",
  unknown: "시각을 모르면 지역으로 보정할 시각도 없어서 시각과 지역 칸을 잠가요. 시주는 비워 둬요.",
};

export const LUNAR_CONVERTER_URL = "https://astro.kasi.re.kr/life/pageView/8";

/** The element to focus for a field, so error summaries and missing-field checks land on the right input. */
export function birthFieldInputId(idPrefix: string, field: SajuBirthFieldKey): string {
  const suffix: Record<SajuBirthFieldKey, string> = {
    birthDate: "birth-date",
    birthTimePrecision: "precision-exact",
    birthHour: "birth-hour",
    birthMinute: "birth-minute",
    provinceCode: "province",
    cityCode: "city",
    luckDirectionBasis: "luck-male",
    dayBoundary: "advanced-toggle",
    equationOfTime: "advanced-toggle",
  };
  return `${idPrefix}-${suffix[field]}`;
}

export interface SajuBirthFieldsProps {
  /** Prefix for element ids; one page may hold only one set of fields. */
  readonly idPrefix: string;
  readonly values: SajuBirthValues;
  readonly onChange: (next: SajuBirthValues) => void;
  readonly catalog: SajuBirthPlacesResponse | null;
  readonly catalogStatus: BirthPlaceCatalogStatus;
  readonly catalogError?: string | null;
  readonly onRetryCatalog?: () => void;
  readonly errors?: Partial<Record<SajuBirthFieldKey, string>>;
  readonly disabled?: boolean;
  /** Fields filled from another screen, marked so the reader can check them. */
  readonly carriedFields?: ReadonlySet<SajuBirthFieldKey>;
}

/**
 * Birth date, time precision, time and place, gender for the luck cycle and the folded calculation
 * settings. The time and place lock to match the precision; locked values are kept, not cleared.
 */
export function SajuBirthFields({
  idPrefix,
  values,
  onChange,
  catalog,
  catalogStatus,
  catalogError,
  onRetryCatalog,
  errors = {},
  disabled = false,
  carriedFields,
}: SajuBirthFieldsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // A server error on an option opens the settings so the message is not hidden.
  const showAdvanced = advancedOpen || Boolean(errors.dayBoundary || errors.equationOfTime);
  const id = (suffix: string) => `${idPrefix}-${suffix}`;
  const precision = values.birthTimePrecision;
  const known = isBirthTimeKnown(precision);
  const hourLocked = disabled || !known;
  const minuteLocked = disabled || precision !== "exact";
  const placeLocked = disabled || !known || catalogStatus !== "ready";
  const province = catalog?.provinces.find((item) => item.provinceCode === values.provinceCode);
  const cities = province?.cities ?? [];
  const carried = (field: SajuBirthFieldKey) => carriedFields?.has(field)
    ? <span className={styles.carried}>가져옴</span>
    : null;
  const update = (patch: Partial<SajuBirthValues>) => onChange({ ...values, ...patch });
  // Eight digits shown as YYYY-MM-DD while typing. Deleting right after a hyphen takes the digit before
  // it, and an edit in the middle keeps the caret next to the same digit once the hyphens move.
  const changeBirthDate = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    let digits = raw.replace(/\D/g, "");
    let digitsBeforeCaret = countDigits(raw.slice(0, caret));
    const previous = values.birthDate;
    // Only a single deleted hyphen counts, so pasting or retyping a whole date never loses a digit.
    const deletedHyphenOnly = raw.length === previous.length - 1 && previous[caret] === "-"
      && previous.slice(0, caret) + previous.slice(caret + 1) === raw;
    if (deletedHyphenOnly && digitsBeforeCaret > 0) {
      digits = digits.slice(0, digitsBeforeCaret - 1) + digits.slice(digitsBeforeCaret);
      digitsBeforeCaret -= 1;
    }
    const next = formatBirthDateInput(digits);
    update({ birthDate: next });
    if (caret < raw.length) {
      const position = digitsBeforeCaret + (digitsBeforeCaret > 4 ? 1 : 0) + (digitsBeforeCaret > 6 ? 1 : 0);
      requestAnimationFrame(() => input.setSelectionRange(position, position));
    }
  };
  const dateComplete = countDigits(values.birthDate) === 8;
  const liveProblem = dateComplete ? birthDateProblem(values.birthDate) : null;
  const dateError = errors.birthDate ?? (liveProblem ? birthDateProblemMessage(values.birthDate, liveProblem) : undefined);
  const confirmation = dateComplete && !dateError ? birthDateConfirmation(values.birthDate) : null;
  const timeErrorIds = [errors.birthHour ? id("birth-hour-error") : "", errors.birthMinute ? id("birth-minute-error") : ""].filter(Boolean);

  return (
    <div className={styles.fields}>
      <div className="field">
        <label htmlFor={id("birth-date")}>양력 생년월일{carried("birthDate")}</label>
        <input
          id={id("birth-date")}
          aria-describedby={[id("birth-date-hint"), dateError ? id("birth-date-error") : "", id("lunar")].filter(Boolean).join(" ")}
          aria-invalid={Boolean(dateError)}
          autoComplete="bday"
          disabled={disabled}
          maxLength={10}
          onChange={changeBirthDate}
          placeholder="예: 1992-08-17"
          type="text"
          value={values.birthDate}
        />
        {confirmation
          ? <p aria-live="polite" className={styles.dateConfirm} id={id("birth-date-hint")}>{confirmation}</p>
          : <p aria-live="polite" className={styles.dateHint} id={id("birth-date-hint")}>숫자 8자리만 입력하면 돼요. 하이픈은 자동으로 들어가요.</p>}
        <p className={styles.lunar} id={id("lunar")}>
          음력 생일은 지원하지 않아요. <a href={LUNAR_CONVERTER_URL} rel="noopener noreferrer" target="_blank">한국천문연구원 음양력 변환</a>에서 양력으로 바꿔 입력해 주세요.
        </p>
        <FieldError id={id("birth-date-error")} message={dateError} />
      </div>

      <fieldset
        className="field"
        aria-describedby={errors.birthTimePrecision ? id("precision-error") : undefined}
        aria-invalid={Boolean(errors.birthTimePrecision)}
        disabled={disabled}
      >
        <legend>출생 시각 정확도{carried("birthTimePrecision")}</legend>
        <div className="choice-list three-columns">
          {PRECISION_OPTIONS.map((option) => (
            <label className="choice-card" key={option.value}>
              <input
                checked={precision === option.value}
                className="sr-only"
                id={id(`precision-${option.value}`)}
                name={id("precision")}
                onChange={() => update({ birthTimePrecision: option.value })}
                type="radio"
                value={option.value}
              />
              <span className="choice-head"><span aria-hidden="true" className="choice-dot" /><strong>{option.label}</strong></span>
              <span className="choice-desc">{option.detail}</span>
            </label>
          ))}
        </div>
        <FieldError id={id("precision-error")} message={errors.birthTimePrecision} />
      </fieldset>

      <fieldset className="field" aria-describedby={[id("time-place-help"), ...timeErrorIds].join(" ")}>
        <legend>태어난 시각과 지역{carried("provinceCode")}</legend>
        <div className={styles.timePlace}>
          <div className={styles.timePair}>
            <select
              aria-describedby={errors.birthHour ? id("birth-hour-error") : undefined}
              aria-invalid={Boolean(errors.birthHour)}
              aria-label="태어난 시"
              disabled={hourLocked}
              id={id("birth-hour")}
              onChange={(event) => update({ birthHour: event.target.value })}
              value={hourLocked ? "" : values.birthHour}
            >
              <option value="">{precision === "unknown" ? "모름" : "시"}</option>
              {HOURS.map((hour) => <option key={hour} value={hour}>{hour}시</option>)}
            </select>
            <select
              aria-describedby={errors.birthMinute ? id("birth-minute-error") : undefined}
              aria-invalid={Boolean(errors.birthMinute)}
              aria-label="태어난 분"
              disabled={minuteLocked}
              id={id("birth-minute")}
              onChange={(event) => update({ birthMinute: event.target.value })}
              value={minuteLocked ? "" : values.birthMinute}
            >
              <option value="">{precision === "exact" || precision === "" ? "분" : "모름"}</option>
              {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}분</option>)}
            </select>
          </div>
          <select
            aria-describedby={errors.provinceCode ? id("province-error") : undefined}
            aria-invalid={Boolean(errors.provinceCode)}
            aria-label="출생 시·도"
            disabled={placeLocked}
            id={id("province")}
            onChange={(event) => onChange(withProvince(values, event.target.value))}
            value={known ? values.provinceCode : ""}
          >
            <option value="">{precision === "unknown" ? "필요 없음" : "시·도 선택"}</option>
            {catalog?.provinces.map((item) => <option key={item.provinceCode} value={item.provinceCode}>{item.provinceName}</option>)}
          </select>
          <select
            aria-describedby={errors.cityCode ? id("city-error") : undefined}
            aria-invalid={Boolean(errors.cityCode)}
            aria-label="출생 시·군·구 (선택)"
            disabled={placeLocked || cities.length === 0}
            id={id("city")}
            onChange={(event) => update({ cityCode: event.target.value })}
            value={known ? values.cityCode : ""}
          >
            <option value="">{precision === "unknown" ? "필요 없음" : "시·군·구 선택 안 함"}</option>
            {cities.map((item) => <option key={item.cityCode} value={item.cityCode}>{item.cityName}</option>)}
          </select>
        </div>
        {known && (catalogStatus === "idle" || catalogStatus === "loading") ? (
          <p className="field-guidance" aria-live="polite">출생지 목록을 불러오고 있어요.</p>
        ) : null}
        {known && catalogStatus === "error" ? (
          <div className="field-inline-error" role="alert">
            <p className="form-error">{catalogError ?? "출생지 목록을 불러오지 못했어요."}</p>
            {onRetryCatalog ? <button className="secondary-button" onClick={onRetryCatalog} type="button">다시 불러오기</button> : null}
          </div>
        ) : null}
        <p className="field-guidance" id={id("time-place-help")}>{TIME_PLACE_HELP[precision]}</p>
        <FieldError id={id("birth-hour-error")} message={errors.birthHour} />
        <FieldError id={id("birth-minute-error")} message={errors.birthMinute} />
        <FieldError id={id("province-error")} message={errors.provinceCode} />
        <FieldError id={id("city-error")} message={errors.cityCode} />
      </fieldset>

      <fieldset
        className="field"
        aria-describedby={errors.luckDirectionBasis ? `${id("luck-help")} ${id("luck-error")}` : id("luck-help")}
        aria-invalid={Boolean(errors.luckDirectionBasis)}
        disabled={disabled}
      >
        <legend>성별{carried("luckDirectionBasis")}</legend>
        <div className="saju-choice-row chips">
          {LUCK_OPTIONS.map((option) => (
            <label className="saju-choice" key={option.value}>
              <input
                checked={values.luckDirectionBasis === option.value}
                id={id(`luck-${option.value}`)}
                name={id("luck")}
                onChange={() => update({ luckDirectionBasis: option.value })}
                type="radio"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <p className="field-guidance" id={id("luck-help")}>10년 단위 흐름(대운)이 어느 방향으로 흐르는지 정할 때만 써요. 선택하지 않으면 그 부분만 빼고 계산해요.</p>
        <FieldError id={id("luck-error")} message={errors.luckDirectionBasis} />
      </fieldset>

      <section className={styles.advanced} aria-labelledby={id("advanced-toggle")}>
        <button
          aria-controls={id("advanced")}
          aria-expanded={showAdvanced}
          className={styles.advancedToggle}
          disabled={disabled}
          id={id("advanced-toggle")}
          onClick={() => setAdvancedOpen(!showAdvanced)}
          type="button"
        >
          <span>계산 방식 설정{carried("dayBoundary")}</span>
          <span className={styles.advancedSummary}>{showAdvanced ? "접기" : calculationOptionsSummary(values)}</span>
        </button>
        {showAdvanced ? (
          <div className={styles.advancedBody} id={id("advanced")}>
            <fieldset className="field" aria-describedby={id("day-boundary-help")} disabled={disabled}>
              <legend>하루가 바뀌는 시각</legend>
              <div className="saju-choice-row chips">
                {([["MIDNIGHT", "자정(00시) · 기본"], ["HOUR_23", "23시(자시 시작)"]] as const).map(([value, label]) => (
                  <label className="saju-choice" key={value}>
                    <input
                      checked={values.dayBoundary === value}
                      name={id("day-boundary")}
                      onChange={() => update({ dayBoundary: value })}
                      type="radio"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="field-guidance" id={id("day-boundary-help")}>23시~24시에 태어났다면 어느 쪽을 고르느냐에 따라 일주가 달라질 수 있어요.</p>
              <FieldError id={id("day-boundary-error")} message={errors.dayBoundary} />
            </fieldset>
            <label className={styles.check}>
              <input
                aria-describedby={id("equation-help")}
                checked={values.equationOfTime}
                disabled={disabled}
                onChange={(event) => update({ equationOfTime: event.target.checked })}
                type="checkbox"
              />
              <span>균시차 보정 적용 <span className={styles.muted}>· 기본</span></span>
            </label>
            <p className="field-guidance" id={id("equation-help")}>지구 공전 궤도 때문에 생기는 태양시 차이(최대 약 16분)를 반영해요.</p>
            <FieldError id={id("equation-error")} message={errors.equationOfTime} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

