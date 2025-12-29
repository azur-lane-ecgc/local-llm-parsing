# Azur Lane Parser

Standalone patch notes parser for Azur Lane. Fetches and processes official patch notes from the game.

## Usage

Run the parser:

- **Parse patch notes**: `bun run main`
- **Lint and format**: `bun run check`

## Configuration

The parser uses `parser.config.json` for all configurable settings:

```json
{
  "modelName": "openai/gpt-oss-20b",
  "lmStudioPort": 1234,
  "outputDir": "output",
  "promptFile": "PROMPT.md",
  "wordpress": {
    "baseUrl": "https://azurlane.yo-star.com/news/",
    "pageAppendUrl": "page/",
    "earliestDate": "2025-10-10"
  }
}
```

**Settings**:

- `modelName`: LM Studio model to use for AI processing
- `lmStudioPort`: Port for LM Studio server
- `outputDir`: Directory for output files
- `promptFile`: Path to the prompt file containing AI instructions
- `wordpress.baseUrl`: WordPress blog URL to crawl
- `wordpress.pageAppendUrl`: URL suffix for pagination
- `wordpress.earliestDate`: Earliest date to fetch posts from (YYYY-MM-DD)

## Architecture

### Modules

- **`src/wordpress-parser.ts`**: WordPress blog crawling with retry logic, content extraction, date parsing, and aggregation
- **`src/ai-pipeline.ts`**: LM Studio CLI integration, AISDK6 text generation, server lifecycle management
- **`src/config.ts`**: Configuration loader
- **`main.ts`**: Orchestrator that coordinates both modules
- **`PROMPT.md`**: AI instructions for extracting ships and equipment from patch notes

### Workflow

1. Load configuration from `parser.config.json`
2. Crawl WordPress blog posts from configured URL with automatic pagination
3. Extract and aggregate post content into `output/YYYY-MM-DD_content.txt`
4. Load LM Studio model via CLI and start local inference server
5. Send content to AI with instructions from `PROMPT.md`
6. Generate structured markdown output (ships, equipment per date)
7. Write results to `output/YYYY-MM-DD.output.md`

### Output Format

The AI generates markdown output with the following structure:

```markdown
## YYYY-MM-DD

### Ships

- **Ship Name**: Description

### Equipment

- **Equipment Name**: Description

---
```

The AI is instructed to:

- Extract ships mentioned with changes/additions (new ships, limited, reruns, retrofits, skill updates, event rewards, etc.)
- Extract equipment mentions (limited gear, reruns, modifications, unlocks, balance adjustments, Gear Lab updates, etc.)
- Use concise descriptions (max 2 sentences)
- Combine multiple posts with the same date into one section

## Requirements

### External Dependencies

- **LM Studio CLI**: Must be installed and accessible via `lms` command (install from https://lmstudio.ai/)
- **Model**: Must match `modelName` in config (must be downloaded in LM Studio)
- **Port**: LM Studio server uses the configured port (default: 1234)

### NPM Dependencies

- `@ai-sdk/openai-compatible`: LM Studio API compatibility
- `ai`: Vercel AI SDK for text generation
- `cheerio`: HTML parsing and content extraction
- `zod`: Schema validation (included but not currently used)
