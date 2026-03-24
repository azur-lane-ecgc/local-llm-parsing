# Azur Lane Parser

Parses Azur Lane patch notes using AI. Scrapes official blog posts, processes with LLM, and publishes to wiki.

## Prerequisites

- [Bun](https://bun.sh)
- [OpenCode](https://github.com/opencode-ai/opencode) — AI orchestration CLI
  - Ensure you are logged in to any providers you plan to use within the CLI directly.

## Usage

### Install

```bash
bun install
```

### Scripts

```bash
bun run scrape                    # Scrape patch notes from blog
bun run patch-notes:p             # Process patch notes
bun run patch-notes:w             # Publish patch notes to wiki
bun run server-news:p             # Process server news list
bun run server-news:w             # Publish server news list to wiki
bun run check                     # Lint + format
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
```

Each domain contains its own `config.json`, `prompts/`, and `outputs/`.
