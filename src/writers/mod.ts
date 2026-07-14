import type { Writer } from "../types.ts";
import { csvWriter } from "./csv.ts";

const REGISTRY: { [format: string]: Writer } = {
  csv: csvWriter,
};

export function getWriter(format: string): Writer {
  const writer = REGISTRY[format];
  if (!writer) throw new Error(`Unknown output format: ${JSON.stringify(format)}`);
  return writer;
}
