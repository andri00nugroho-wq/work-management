/** Penyusun iCalendar (RFC 5545) minimal untuk acara sehari penuh. */

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lipat baris > 75 oktet: lanjutan diawali satu spasi. */
function fold(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const dateValue = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, "");
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export type IcsEvent = {
  uid: string;
  title: string;
  description: string;
  start: Date;
  /** Hari terakhir (inklusif). */
  end: Date;
  updatedAt: Date;
  url?: string;
};

export function buildCalendar(name: string, events: IcsEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Raja Emas Indonesia//REI Work Management//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:Asia/Jakarta",
  ];
  for (const event of events) {
    const exclusiveEnd = new Date(event.end.getTime() + 24 * 60 * 60 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp(event.updatedAt)}`,
      `LAST-MODIFIED:${stamp(event.updatedAt)}`,
      `DTSTART;VALUE=DATE:${dateValue(event.start)}`,
      `DTEND;VALUE=DATE:${dateValue(exclusiveEnd)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      ...(event.url ? [`URL:${event.url}`] : []),
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
