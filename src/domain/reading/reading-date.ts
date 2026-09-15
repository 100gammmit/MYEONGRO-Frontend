// Readings are stored as UTC instants but read in Korea, so the date always follows KST.
// Without a fixed zone the server's own zone decides, and on a UTC server a reading made
// between midnight and 9am KST would show the previous day.
const READING_DATE = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});

export function formatReadingDate(isoInstant: string): string {
  return READING_DATE.format(new Date(isoInstant));
}
