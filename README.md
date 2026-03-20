# Azur Lane Parser

Parses Azur Lane patch notes using AI. Scrapes official patch note blog posts, processes with LLM, and publishes to wiki.

## Prerequisites

- [Bun](https://bun.sh) (recommended)
  - You can also use Node.js 18+ with npm, but you would need to update `package.json` accordingly. All logic files are package-manager agnostic.
- [OpenCode](https://github.com/opencode-ai/opencode) - AI orchestration CLI

## Usage

Install deps:

```bash
bun install
```

Scripts:

```bash
bun run scrape       # Scrape patch notes from blog
bun run process      # Process scraped content with OpenCode
bun run wiki         # Publish processed output to wiki
bun run check        # Lint + format (oxlint, oxfmt)
bun test             # Run tests (vitest)
```

## Configuration

### parser.config.json

```typescript
interface Config {
  earliestDate: string // Start date (YYYY-M-D)
  latestDate?: string | false // End date, false = now
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
  wikitext: {
    page: string // Wiki page to edit
  }
}
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
WIKI_USERNAME=     # Wiki account username
WIKI_PASSWORD=     # Wiki account password
WIKI_API_URL=      # MediaWiki API endpoint
WIKI_USER_AGENT=   # User agent string
```

## Project Structure

```
├── src/
│   ├── scrape.ts      # WordPress blog scraper
│   ├── opencode.ts    # OpenCode server + batch processor
│   ├── wiki.ts        # MediaWiki editor
│   └── config.ts      # Config loader
├── prompts/           # LLM prompt templates
│   ├── optimized-patch-notes/
├── output/
│   ├── azur_lane_patch_notes/  # Web scraped patch notes
│   └── llm/patch_notes/        # LLM-processed output
└── AzurLaneData/               # Game data submodule
```
