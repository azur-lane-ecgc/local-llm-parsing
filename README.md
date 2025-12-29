# Azur Lane Parser

Parses Azur Lane patch notes using local AI. Fetches official posts and extracts ships/equipment updates.

## Prerequisites

- [Bun](https://bun.sh) - Runtime and package manager
- [LM Studio](https://lmstudio.ai/) - Local AI model server

## Usage

```bash
bun run main
```

## Setup

Configure `parser.config.json`:

- `modelName`: Model to use (must already be downloaded in LM Studio)
- `lmStudioPort`: Port for LM Studio server (default: 1234)
- `wordpress.baseUrl`: Patch notes URL to crawl
- `wordpress.earliestDate`: Start date for fetching (YYYY-MM-DD)

## Output

Generates markdown files in `output/` with:

- Ships added/modified (new, limited, retrofits, events)
- Equipment updates (limited gear, unlocks, balance changes)
- Structured by date with concise descriptions
