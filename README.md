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

Run directly:

```bash
bun src/scrape/scrape.ts         # Scrape patch notes from blog
bun src/opencode/opencode.ts     # Process scraped content with OpenCode
bun src/wiki/wiki-patch-notes.ts # Publish patch notes to wiki
```

Or use npm scripts:

```bash
bun run scrape                   # Scrape + lint/format
bun run process                  # Process + lint/format
bun run wiki-patch-notes         # Publish patch notes to wiki
bun run check                    # Lint + format (oxlint, oxfmt)
bun run test                     # Run tests (vitest)
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

## Creating Prompts

Prompts live in `prompts/` and must include YAML frontmatter:

```markdown
---
folder: patch_notes
---

Your prompt content here...
```

The `folder` key is appended to `llm.outputDir` from config (e.g., `folder: patch_notes` → `{outputDir}/patch_notes/`).

## Project Structure

```
├── src/
│   ├── scrape/           # WordPress blog scraper
│   │   └── scrape.ts
│   ├── opencode/         # OpenCode server + batch processor
│   │   └── opencode.ts
│   ├── wiki/             # MediaWiki editor
│   │   └── wiki-patch-notes.ts
│   ├── config.ts         # Config loader
│   └── utils.ts          # Shared utilities
├── prompts/              # LLM prompt templates
├── output/
│   ├── scrape/           # Scraped content
│   └── llm/              # LLM-processed output
└── AzurLaneData/         # Game data submodule
```
