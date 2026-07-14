import { run } from "./scrape.ts";

const htmlPath = Deno.args[0];
if (!htmlPath) {
  console.error("Usage: postprocess.ts <downloaded-html-file>");
  Deno.exit(1);
}

await run(htmlPath, { format: "csv", outPath: "data/ilektrokinisi3.csv" });

// Delete the raw HTML so Flat only commits the CSV (raw HTML has a per-request
// desktop id that would otherwise churn the repo on every run)
try {
  await Deno.remove(htmlPath);
} catch {
  // best-effort
}
