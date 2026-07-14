# Plan: Scrape kinoumeilektrika3.gov.gr into a CSV via Flat Data

## Context

Build a GitHub repo that, twice per day, scrapes the electric-mobility subsidy
availability table from `https://kinoumeilektrika3.gov.gr/ilektrokinisi3/` and
records it as a growing time-series CSV. The user wants the "Flat Data"
GitHub-Action approach (`githubocto/flat`), a Deno postprocess script, code under
`src/` with tests under `tests/`, output-format modularity (CSV now; JSON/SQLite
pluggable later), and basic validation to reject bad data.

### Key discovery (drives the whole design)

The page looks like an empty JS SPA ("Processing..."), but it is a **ZK
Framework** app whose table data is **embedded server-side in the initial HTML**
inside an inline `zkmx([...])` bootstrap script. A plain HTTP GET (verified — no
User-Agent, cookies, or JS needed) returns everything. So Flat's built-in fetch
is sufficient; **no browser and no ZK AJAX round-trip required** — we parse the
inline script text.

Each cell we care about has a **stable `id` anchor**, so parsing keys off ids
rather than fragile positions. The 4 target items (each has a
Προϋπολογισμός = budget and a Διαθέσιμο Ποσό = available):

| Item | audience | category | id prefix |
|---|---|---|---|
| Ιδιώτες Οχήματα | idiotes | ochimata | `totalIdiotesCar` |
| Ιδιώτες Ποδήλατα | idiotes | podilata | `totalIdiotesBike` |
| Επιχειρήσεις Οχήματα | epixiriseis | ochimata | `totalEpixiriseisCar` |
| Επιχειρήσεις Ποδήλατα | epixiriseis | podilata | `totalEpixiriseisBike` |

Cell shape in HTML: `{id:'totalIdiotesCarBudget',label:'39.790.300,00'}` and
`...Available',label:'389.947,44'`. There is also a last-update label
`{id:'dateLabel',value:'14 Ιουλ 2026, 10:47:24'}` (Greek
unicode-escaped). Totals rows (`totalBudget`, `totalIdiotes*`, `totalEpixiriseis*`
aggregate) are intentionally **ignored**.

Numbers are Greek-formatted: `.` = thousands separator, `,` = decimal
(`39.790.300,00` → `39790300.00`).

## Project layout

```
.github/workflows/flat.yml   # Flat action: schedule (twice/day) + workflow_dispatch
deno.json                    # tasks (test/fmt/lint/scrape-local), fmt/lint config
src/
  postprocess.ts             # Flat entrypoint: Deno.args[0] = downloaded HTML file
  scrape.ts                  # orchestration: read html -> parse -> validate -> write
  parse.ts                   # extract 4 records + sourceUpdated from inline zkmx script
  validate.ts                # validation rules (throw on violation)
  types.ts                   # Audience/Category/Record/Writer interface + item map
  writers/
    mod.ts                   # writer registry / factory: getWriter(format)
    csv.ts                   # CSV writer (append time-series) — implemented
tests/
  parse_test.ts
  validate_test.ts
  csv_test.ts
  fixtures/page.html         # saved real sample (already captured) for offline tests
data/
  ilektrokinisi3.csv         # committed output (created on first run)
README.md
.gitignore
```

## Data model (`src/types.ts`)

```ts
export type Audience = "idiotes" | "epixiriseis";
export type Category = "ochimata" | "podilata";

export interface Record {
  scrapedAt: string;      // ISO-8601 UTC, when this run fetched
  sourceUpdated: string;  // parsed from dateLabel, Europe/Athens local (naive ISO)
  audience: Audience;
  category: Category;
  budget: number;         // Προϋπολογισμός
  available: number;      // Διαθέσιμο Ποσό
}

export interface WriteOptions { path: string }
export interface Writer { write(records: Record[], opts: WriteOptions): Promise<void>; }
```

A single `ITEMS` table maps `{ idPrefix, audience, category }` for the 4 targets;
`parse.ts` and tests both consume it (single source of truth).

## Parsing (`src/parse.ts`)

- Input: raw HTML string.
- For each of the 4 items, regex-extract
  `id:'<prefix>Budget',label:'([^']*)'` and `...Available',label:'([^']*)'`.
- Extract `dateLabel` value; decode `\uXXXX` escapes; map Greek month abbrev
  (Ιαν..Δεκ) → month number; produce naive ISO `2026-07-14T10:47:24`.
- Greek number parse helper: strip `.`, replace `,`→`.`, `Number()`.
- Throw a descriptive error if any anchor is missing or a number fails to parse
  (structure changed / fetch failed) so the run fails loudly rather than writing
  garbage.
- No DOM library needed — data lives inside a `<script>`, so `deno-dom` would not
  see it. Pure string/regex parsing keyed on stable ids.

## Validation (`src/validate.ts`)

Per record, throw on violation (fails the workflow, so no bad commit):
- `budget` and `available` are finite numbers.
- `budget >= 0` and `available >= 0` (no negatives).
- `available <= budget` (available cannot exceed budget).
Aggregate errors into one message listing every offending item.

## Writers (`src/writers/`)

- `Writer` interface in `types.ts`; `writers/mod.ts` exposes
  `getWriter(format: string): Writer` with a registry map. Adding JSON/SQLite
  later = add a file + one registry entry; no caller changes.
- `writers/csv.ts` (implemented, **append time-series**):
  - Fixed header: `scrapedAt,sourceUpdated,audience,category,budget,available`.
  - If file missing → write header first. Then append the 4 new rows.
  - Numbers written in plain machine format (dot decimal, no thousands sep) for
    downstream tooling.
- JSON/SQLite: **not built now** but interface + factory make them drop-in;
  README documents the extension point.

## Orchestration & entrypoint

- `src/scrape.ts`: `run(htmlPath, { format, outPath, now })` → read file, parse,
  validate, `getWriter(format).write(records, {path})`. `now` injectable for
  deterministic tests.
- `src/postprocess.ts`: Flat entrypoint. Reads `Deno.args[0]` (downloaded file),
  calls `scrape.run(...)` with `format="csv"`, `outPath="data/ilektrokinisi3.csv"`.
  Then **deletes the downloaded raw HTML** so Flat commits only the CSV — the raw
  HTML embeds a per-request desktop id that changes every fetch and would
  otherwise churn the repo on every run.

## Flat workflow (`.github/workflows/flat.yml`)

```yaml
on:
  schedule:
    - cron: "0 6,18 * * *"   # 06:00 & 18:00 UTC, twice daily
  workflow_dispatch:
jobs:
  scheduled:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: githubocto/flat@v3
        with:
          http_url: https://kinoumeilektrika3.gov.gr/ilektrokinisi3/
          downloaded_filename: data/raw.html
          postprocess: src/postprocess.ts
```

(Flat provides Deno and runs the postprocess with the downloaded filename as
argv[0]; needs `contents: write` permission — note in README that repo
Actions must allow write.)

## Tests (`tests/`, `deno test`)

- `parse_test.ts`: against `fixtures/page.html`, assert 4 records with exact
  expected budget/available and the parsed `sourceUpdated`; assert a missing
  anchor throws.
- `validate_test.ts`: passes clean data; throws on negative and on
  `available > budget`.
- `csv_test.ts`: writes to a temp file — header created once, subsequent call
  appends (time-series growth), values machine-formatted.

## deno.json tasks

`test` (`deno test -A`), `fmt`, `lint`, and `scrape-local`
(`deno run -A src/postprocess.ts tests/fixtures/page.html` for manual runs).

## Verification

1. `deno task test` — all unit tests pass.
2. `deno task fmt --check` and `deno task lint` — clean.
3. Offline E2E: `deno run -A src/postprocess.ts tests/fixtures/page.html` →
   inspect `data/ilektrokinisi3.csv` has header + 4 correct rows; run again →
   4 more rows appended (append works).
4. Negative check: hand-edit a fixture so `available > budget` → run exits
   non-zero with a clear message and does not write.
5. `git init` + initial commit locally (user adds the GitHub remote and enables
   Actions write permission; `workflow_dispatch` lets them trigger the first
   real run manually to confirm the live fetch + commit).

## Notes / decisions

- Append every run (one observation per item per run); `sourceUpdated` column
  distinguishes genuine source changes from unchanged polls.
- `sourceUpdated` stored as Europe/Athens naive local time (as the site
  displays); `scrapedAt` in UTC.
- No secrets required; the endpoint is public and unauthenticated.
- Deno runs inside a Podman container for local development and testing.
