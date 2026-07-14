import { assertThrows } from "jsr:@std/assert";
import { validate } from "../src/validate.ts";
import type { Record } from "../src/types.ts";

const good: Record[] = [
  {
    scrapedAt: "t",
    sourceUpdated: "t",
    audience: "idiotes",
    category: "ochimata",
    budget: 100,
    available: 50,
  },
  {
    scrapedAt: "t",
    sourceUpdated: "t",
    audience: "idiotes",
    category: "podilata",
    budget: 200,
    available: 0,
  },
  {
    scrapedAt: "t",
    sourceUpdated: "t",
    audience: "epixiriseis",
    category: "ochimata",
    budget: 300,
    available: 300,
  },
  {
    scrapedAt: "t",
    sourceUpdated: "t",
    audience: "epixiriseis",
    category: "podilata",
    budget: 400,
    available: 1,
  },
];

Deno.test("validate passes clean data", () => {
  validate(good);
});

Deno.test("validate throws on negative available", () => {
  const bad = [...good];
  bad[0] = { ...bad[0], available: -1 };
  assertThrows(() => validate(bad), Error, "available < 0");
});

Deno.test("validate throws on negative budget", () => {
  const bad = [...good];
  bad[0] = { ...bad[0], budget: -5 };
  assertThrows(() => validate(bad), Error, "budget < 0");
});

Deno.test("validate throws on available > budget", () => {
  const bad = [...good];
  bad[0] = { ...bad[0], available: 150, budget: 100 };
  assertThrows(() => validate(bad), Error, "available");
});
