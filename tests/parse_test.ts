import { assertEquals, assertThrows } from "jsr:@std/assert";
import { parse } from "../src/parse.ts";

const html = await Deno.readTextFile(
  new URL("fixtures/page.html", import.meta.url),
);

Deno.test("parse returns 4 records", () => {
  const records = parse(html, "2026-07-14T12:00:00.000Z");
  assertEquals(records.length, 4);
});

Deno.test("parse idiotes/ochimata values", () => {
  const records = parse(html, "2026-07-14T12:00:00.000Z");
  const r = records.find(
    (r) => r.audience === "idiotes" && r.category === "ochimata",
  )!;
  assertEquals(r.budget, 39790300);
  assertEquals(r.available, 380161.96);
  assertEquals(r.sourceUpdated, "2026-07-14T12:47:24");
});

Deno.test("parse idiotes/podilata values", () => {
  const records = parse(html, "2026-07-14T12:00:00.000Z");
  const r = records.find(
    (r) => r.audience === "idiotes" && r.category === "podilata",
  )!;
  assertEquals(r.budget, 2410000);
  assertEquals(r.available, 92.74);
});

Deno.test("parse epixiriseis/ochimata values", () => {
  const records = parse(html, "2026-07-14T12:00:00.000Z");
  const r = records.find(
    (r) => r.audience === "epixiriseis" && r.category === "ochimata",
  )!;
  assertEquals(r.budget, 23530000);
  assertEquals(r.available, 352060.7);
});

Deno.test("parse epixiriseis/podilata values", () => {
  const records = parse(html, "2026-07-14T12:00:00.000Z");
  const r = records.find(
    (r) => r.audience === "epixiriseis" && r.category === "podilata",
  )!;
  assertEquals(r.budget, 269700);
  assertEquals(r.available, 89.15);
});

Deno.test("parse throws on missing anchor", () => {
  const broken = html.replace("totalIdiotesCarBudget", "GONE");
  assertThrows(
    () => parse(broken, "2026-07-14T12:00:00.000Z"),
    Error,
    "Parse errors",
  );
});
