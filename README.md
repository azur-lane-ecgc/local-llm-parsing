# Azur Lane Parser

Parses Azur Lane patch notes using AI. Scrapes official blog posts, processes with LLM, and publishes to wiki.

## Prerequisites

- [Bun](https://bun.sh)
- [OpenCode](https://github.com/opencode-ai/opencode) — AI orchestration CLI

## Usage

```bash
bun install
bun run scrape                        # Scrape patch notes from blog
bun run process                       # Process patch notes (alias)
bun run process:patch-notes           # Process patch notes
bun run process:server-news-list      # Process server news list
bun run wiki:patch-notes              # Publish patch notes to wiki
bun run wiki:server-news-list         # Publish server news list to wiki
bun run check                         # Lint + format
bun run test                          # Run tests
```

## Configuration

Each domain has its own `config.json`. See `scrape/`, `patch-notes/`, and `server-news-list/` for examples.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in wiki credentials.

## Project Structure

```
AzurLaneData/            # Game data submodule
scrape/                  # Blog scraper
patch-notes/             # Patch notes pipeline (run + wiki)
server-news-list/        # Server news list pipeline (run + wiki)
utils/                   # Shared code (config loader, helpers, LLM utilities)
prompts/test/            # Shared test prompts
```

Each domain contains its own `config.json`, `prompts/`, and `outputs/`.
