# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
deno task test          # run all tests
deno task fmt           # format source
deno task lint          # lint source
deno task scrape-local  # offline end-to-end run against tests/fixtures/page.html

# run a single test file
deno test -A tests/parse_test.ts
```

## Architecture

The pipeline is: **fetch → parse → validate → write**.

`src/postprocess.ts` is the entry point invoked by the GitHub Actions flat-data workflow. It calls `scrape.run()` with a path to the downloaded HTML, then deletes the raw HTML so only the CSV is committed (the HTML contains a per-request desktop ID that would churn git history).

`scrape.run()` (`src/scrape.ts`) orchestrates the three stages:
1. `parse(html, now)` (`src/parse.ts`) — extracts the four budget/available pairs by matching inline JS variable patterns in the page source (`id:'<idPrefix>Budget'` / `id:'<idPrefix>Available'`). Also parses the Greek-locale date string from `dateLabel` into an ISO timestamp.
2. `validate(records)` (`src/validate.ts`) — sanity-checks the numbers (non-negative, available ≤ budget).
3. `getWriter(format).write(records, opts)` (`src/writers/mod.ts`) — looks up the format in a registry and delegates to the concrete writer.

**Adding a new output format:** implement the `Writer` interface from `src/types.ts`, register it in `src/writers/mod.ts`. No other files need changing.

**Data model** (`src/types.ts`): four `Record`s per scrape run, one per combination of `audience` (`idiotes` | `epixiriseis`) × `category` (`ochimata` | `podilata`). The `ITEMS` constant defines the four combinations and the corresponding HTML id prefixes used during parsing.

**CI:** `.github/workflows/flat.yml` runs at 06:00 and 18:00 UTC using the `githubocto/flat` action, which fetches the page and calls `postprocess.ts`. The repo needs "Read and write permissions" under Settings → Actions → General for the action to commit the CSV.

**Tests** live in `tests/` alongside a `fixtures/` directory with a saved copy of the page for offline parsing tests.
