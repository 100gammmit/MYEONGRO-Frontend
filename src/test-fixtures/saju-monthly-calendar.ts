// Structural parser fixture only; astronomical golden values are tested in Backend.
export function sajuMonthlyCalendarFixture(targetYear = 2027) {
  return {
    calculationVersion: "saju-monthly-ko-v1", timeZone: "Asia/Seoul", targetYear,
    months: Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const prefix = `${targetYear}-${String(month).padStart(2, "0")}`;
      const start = `${prefix}-01T00:00:00+09:00`;
      const cut = `${prefix}-06T12:00:00+09:00`;
      const end = month === 12 ? `${targetYear + 1}-01-01T00:00:00+09:00`
        : `${targetYear}-${String(month + 1).padStart(2, "0")}-01T00:00:00+09:00`;
      return { month, periods: [
        { startInclusive: start, endExclusive: cut, yearGanZhi: "정미", monthGanZhi: "임자", stemTenGod: "비견" },
        { startInclusive: cut, endExclusive: end, yearGanZhi: "정미", monthGanZhi: "계축", stemTenGod: "겁재" },
      ] };
    }),
  };
}
