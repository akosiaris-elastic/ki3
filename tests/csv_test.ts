import { assertEquals } from "jsr:@std/assert";
import { csvWriter } from "../src/writers/csv.ts";
import type { Record } from "../src/types.ts";

const records: Record[] = [
  {
    scrapedAt: "2026-07-14T10:00:00.000Z",
    sourceUpdated: "2026-07-14T12:47:24",
    audience: "idiotes",
    category: "ochimata",
    budget: 39790300,
    available: 380161.96,
  },
  {
    scrapedAt: "2026-07-14T10:00:00.000Z",
    sourceUpdated: "2026-07-14T12:47:24",
    audience: "idiotes",
    category: "podilata",
    budget: 2410000,
    available: 92.74,
  },
  {
    scrapedAt: "2026-07-14T10:00:00.000Z",
    sourceUpdated: "2026-07-14T12:47:24",
    audience: "epixiriseis",
    category: "ochimata",
    budget: 23530000,
    available: 352060.7,
  },
  {
    scrapedAt: "2026-07-14T10:00:00.000Z",
    sourceUpdated: "2026-07-14T12:47:24",
    audience: "epixiriseis",
    category: "podilata",
    budget: 269700,
    available: 89.15,
  },
];

Deno.test("csv creates header on first write", async () => {
  const path = await Deno.makeTempFile({ suffix: ".csv" });
  await Deno.remove(path);
  await csvWriter.write(records, { path });
  const content = await Deno.readTextFile(path);
  const lines = content.trim().split("\n");
  assertEquals(lines[0], "scrapedAt,sourceUpdated,audience,category,budget,available");
  assertEquals(lines.length, 5); // header + 4 rows
  await Deno.remove(path);
});

Deno.test("csv appends on subsequent write", async () => {
  const path = await Deno.makeTempFile({ suffix: ".csv" });
  await Deno.remove(path);
  await csvWriter.write(records, { path });
  await csvWriter.write(records, { path });
  const content = await Deno.readTextFile(path);
  const lines = content.trim().split("\n");
  assertEquals(lines[0], "scrapedAt,sourceUpdated,audience,category,budget,available");
  assertEquals(lines.length, 9); // header + 4 + 4 rows
  await Deno.remove(path);
});

Deno.test("csv values are machine-formatted", async () => {
  const path = await Deno.makeTempFile({ suffix: ".csv" });
  await Deno.remove(path);
  await csvWriter.write(records, { path });
  const content = await Deno.readTextFile(path);
  const lines = content.trim().split("\n");
  assertEquals(
    lines[1],
    "2026-07-14T10:00:00.000Z,2026-07-14T12:47:24,idiotes,ochimata,39790300,380161.96",
  );
  await Deno.remove(path);
});
