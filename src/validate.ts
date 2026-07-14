import type { Record } from "./types.ts";

export function validate(records: Record[]): void {
  const errors: string[] = [];
  for (const r of records) {
    const id = `${r.audience}/${r.category}`;
    if (!isFinite(r.budget)) errors.push(`${id}: budget is not finite`);
    if (!isFinite(r.available)) errors.push(`${id}: available is not finite`);
    if (r.budget < 0) errors.push(`${id}: budget < 0`);
    if (r.available < 0) errors.push(`${id}: available < 0`);
    if (r.available > r.budget) {
      errors.push(`${id}: available (${r.available}) > budget (${r.budget})`);
    }
  }
  if (errors.length) throw new Error(`Validation errors:\n${errors.join("\n")}`);
}
