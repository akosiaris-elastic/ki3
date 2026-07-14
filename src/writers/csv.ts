import type { Record, WriteOptions, Writer } from "../types.ts";

const HEADER = "scrapedAt,sourceUpdated,audience,category,budget,available";

export const csvWriter: Writer = {
  async write(records: Record[], opts: WriteOptions): Promise<void> {
    let exists = false;
    try {
      await Deno.stat(opts.path);
      exists = true;
    } catch {
      // file does not exist yet
    }
    let content = exists ? "" : HEADER + "\n";
    for (const r of records) {
      content +=
        `${r.scrapedAt},${r.sourceUpdated},${r.audience},${r.category},${r.budget},${r.available}\n`;
    }
    await Deno.writeTextFile(opts.path, content, { append: exists });
  },
};
