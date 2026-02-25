# Azur Lane Parser

Parses Azur Lane patch notes using local AI. Fetches official posts and extracts ships/equipment updates.

## Prerequisites

- [Bun](https://bun.sh) - Runtime and package manager
- [LM Studio](https://lmstudio.ai/) - Local AI model server (for default/`-p` mode)
- [OpenCode](https://github.com/opencode-ai/opencode) - AI Harness / TUI (for `-o` mode)

## Usage

```bash
bun run main          # Scrape + process with LM Studio
bun run main -s       # Scrape only
bun run main -p       # Process with LM Studio only
bun run main -o       # Process with OpenCode only
```

## Setup

Configure `parser.config.json`:

- `lmStudioModel`: Model for LM Studio (must already be downloaded)
- `lmStudioPort`: Port for LM Studio server (default: 1234)
- `opencodeModel`: Model for OpenCode processing
- `wordpress.baseUrl`: Patch notes URL to crawl
- `wordpress.earliestDate`: Start date for fetching (YYYY-MM-DD)

## Output

Generates markdown files in `output/` with:

- Ships added/modified (new, limited, retrofits, events)
- Equipment updates (limited gear, unlocks, balance changes)
- Structured by date with concise descriptions
