import { runScrape } from "./src/scrape"
import { runOpenCode } from "./src/opencode"
import { runWiki } from "./src/wiki"

const parseArgs = (): { mode: "scrape" | "opencode" | "wiki" } | null => {
  const args = process.argv.slice(2)
  if (args.includes("-s")) return { mode: "scrape" }
  if (args.includes("-o")) return { mode: "opencode" }
  if (args.includes("-w")) return { mode: "wiki" }
  return null
}

const main = async () => {
  const parsed = parseArgs()
  if (!parsed) {
    console.error("Error: No mode specified\n")
    console.error("Usage:")
    console.error("  bun main.ts -s    Scrape patch notes")
    console.error("  bun main.ts -o    Process with OpenCode")
    console.error("  bun main.ts -w    Test wiki login")
    console.error("\nOr use npm scripts:")
    console.error("  bun run scrape    Scrape only")
    console.error("  bun run process   Process only")
    console.error("  bun run wiki      Test wiki")
    console.error("  bun run main      Scrape + process")
    process.exit(1)
  }
  switch (parsed.mode) {
    case "scrape":
      await runScrape()
      break
    case "opencode":
      await runOpenCode()
      break
    case "wiki":
      await runWiki()
      break
  }
}

main().catch((error) => {
  console.error("\nFatal Error:")
  console.error((error as Error).message)
  if ((error as Error).stack) {
    console.error("\nStack trace:")
    console.error((error as Error).stack)
  }
  process.exit(1)
})
