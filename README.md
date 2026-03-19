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

```typescript
interface Config {
  earliestDate: string
  latestDate?: string | false
  wordpress: {
    baseUrl: string
    pageAppendUrl: string
    outputDir: string
    outputFileExtension: string
  }
  llm: {
    model: string
    outputDir: string
    promptFile: string
    outputFileExtension: string
  }
}
```

## Output

Generates markdown files in `output/` with:

- Ships added/modified (new, limited, retrofits, events)
- Equipment updates (limited gear, unlocks, balance changes)
- Structured by date with concise descriptions
