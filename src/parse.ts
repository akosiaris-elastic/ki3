import { ITEMS, type Record } from "./types.ts";

// Map Greek month abbreviations to zero-padded month numbers
const GREEK_MONTHS: { [key: string]: string } = {
  "Ιαν": "01",
  "Φεβ": "02",
  "Μαρ": "03",
  "Απρ": "04",
  "Μαΐ": "05",
  "Ιουν": "06",
  "Ιουλ": "07",
  "Αυγ": "08",
  "Σεπ": "09",
  "Οκτ": "10",
  "Νοε": "11",
  "Δεκ": "12",
};

function parseGreekNumber(s: string): number {
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  if (!isFinite(n)) throw new Error(`Cannot parse number: ${JSON.stringify(s)}`);
  return n;
}

function decodeUnicode(s: string): string {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function parseSourceUpdated(html: string): string {
  const m = html.match(/id:'dateLabel',value:'([^']+)'/);
  if (!m) throw new Error("dateLabel not found in HTML");
  const raw = decodeUnicode(m[1]);
  // e.g. "14 Ιουλ 2026, 12:47:24"
  const dm = raw.match(/(\d{1,2}) (\S+) (\d{4}), (\d{2}:\d{2}:\d{2})/);
  if (!dm) throw new Error(`Cannot parse dateLabel: ${JSON.stringify(raw)}`);
  const [, day, monthName, year, time] = dm;
  const month = GREEK_MONTHS[monthName];
  if (!month) throw new Error(`Unknown Greek month: ${JSON.stringify(monthName)}`);
  return `${year}-${month}-${day.padStart(2, "0")}T${time}`;
}

export function parse(html: string, scrapedAt: string): Record[] {
  const sourceUpdated = parseSourceUpdated(html);
  const errors: string[] = [];
  const records: Record[] = [];

  for (const item of ITEMS) {
    const budgetM = html.match(
      new RegExp(`id:'${item.idPrefix}Budget',label:'([^']*)'`),
    );
    const availM = html.match(
      new RegExp(`id:'${item.idPrefix}Available',label:'([^']*)'`),
    );
    if (!budgetM) errors.push(`Missing ${item.idPrefix}Budget`);
    if (!availM) errors.push(`Missing ${item.idPrefix}Available`);
    if (!budgetM || !availM) continue;
    try {
      records.push({
        scrapedAt,
        sourceUpdated,
        audience: item.audience,
        category: item.category,
        budget: parseGreekNumber(budgetM[1]),
        available: parseGreekNumber(availM[1]),
      });
    } catch (e) {
      errors.push(`${item.idPrefix}: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (errors.length) throw new Error(`Parse errors:\n${errors.join("\n")}`);
  return records;
}
