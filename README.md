# Azur Lane Parser

Parses Azur Lane patch notes using AI. Fetches official posts and extracts ships/equipment updates.

## Prerequisites

- [Bun](https://bun.sh) - Runtime and package manager
- [OpenCode](https://github.com/opencode-ai/opencode) - AI Harness / TUI

## Usage

```bash
bun run main          # Scrape + process with OpenCode
bun run main -s       # Scrape only
bun run main -o       # Process with OpenCode only
```

## Setup

Configure `parser.config.json`:

- `opencodeModel`: Model for OpenCode processing
- `wordpress.baseUrl`: Patch notes URL to crawl
- `wordpress.earliestDate`: Earliest date to fetch (YYYY-MM-DD)
- `wordpress.latestDate`: Latest date to fetch (YYYY-MM-DD), or `false` to start from page 1

## Output

Generates markdown files in `output/` with:

- Ships added/modified (new, limited, retrofits, events)
- Equipment updates (limited gear, unlocks, balance changes)
- Structured by date with concise descriptions
