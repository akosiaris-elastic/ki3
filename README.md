# Disclaimer (this the human written part)

This is my learning app to get more acquainted with Code Claude, which I wasn't
as much acquainted as I want with (I was acquainted with other Coding agents
like Copilot however). Almost everything else, is read/written using Claude
Code. I plan to figure out at some point whether I also want to keep the
prompts around.

# ki3 — electric-mobility subsidy tracker

Twice per day, a GitHub Actions workflow fetches the subsidy availability table
from [kinoumeilektrika3.gov.gr](https://kinoumeilektrika3.gov.gr/ilektrokinisi3/)
and appends a row per category to `data/ilektrokinisi3.csv`.

## Data

`data/ilektrokinisi3.csv` — growing time-series with columns:

| column | description |
|---|---|
| `scrapedAt` | ISO-8601 UTC timestamp of the fetch |
| `sourceUpdated` | site's own last-update timestamp (Europe/Athens, naive local time) |
| `audience` | `idiotes` (individuals) or `epixiriseis` (businesses) |
| `category` | `ochimata` (vehicles) or `podilata` (bicycles) |
| `budget` | total programme budget (€) |
| `available` | remaining available amount (€) |

## Schedule

Runs at 06:00 and 18:00 UTC daily, and can be triggered manually via
`workflow_dispatch`.

**Prerequisites:** in the repo's Settings → Actions → General, set
"Workflow permissions" to "Read and write permissions" so the Action can commit
the updated CSV.

## Local development

Requires [Deno](https://deno.com/).

```sh
# run all tests
deno task test

# format and lint
deno task fmt
deno task lint

# offline end-to-end run against the saved fixture
deno task scrape-local
# inspect data/ilektrokinisi3.csv — run again to confirm append
```

## Adding output formats

Implement the `Writer` interface from `src/types.ts`, register it in
`src/writers/mod.ts`, and pass `format: "yourformat"` to `scrape.run()`.
No other callers need changing.
