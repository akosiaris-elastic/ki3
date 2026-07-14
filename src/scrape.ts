import { parse } from "./parse.ts";
import { validate } from "./validate.ts";
import { getWriter } from "./writers/mod.ts";

interface RunOptions {
  format?: string;
  outPath?: string;
  now?: string;
}

export async function run(
  htmlPath: string,
  opts: RunOptions = {},
): Promise<void> {
  const format = opts.format ?? "csv";
  const outPath = opts.outPath ?? "data/ilektrokinisi3.csv";
  const now = opts.now ?? new Date().toISOString();

  const html = await Deno.readTextFile(htmlPath);
  const records = parse(html, now);
  validate(records);
  await getWriter(format).write(records, { path: outPath });
}
