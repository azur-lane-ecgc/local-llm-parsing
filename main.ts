import {
  crawlBlog,
  groupPostsByDate,
  formatPostGroup,
  writePostGroupContent,
} from "./src/wordpress-parser"
import {
  withOpenCodeServer,
  processWithOpenCode,
} from "./src/opencode-pipeline"
import { testWikiLogin } from "./src/wiki"
import { mkdir, writeFile } from "node:fs/promises"
import { readFile, readdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { loadConfig } from "./src/config"
import { join } from "node:path"

const parsePromptFrontmatter = async (
  promptPath: string,
): Promise<{ folder?: string }> => {
  try {
    const content = await readFile(promptPath, "utf-8")
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return {}
    const frontmatter = match[1]
    const folderMatch = frontmatter?.match(/^folder:\s*(.+)$/m)
    return { folder: folderMatch?.[1]?.trim() }
  } catch {
    return {}
  }
}

const emptyFile = async (filePath: string): Promise<void> => {
  if (existsSync(filePath)) {
    await writeFile(filePath, "")
  }
}

const parseArgs = (): { mode: "scrape" | "opencode" | "wiki" } | null => {
  const args = process.argv.slice(2)
  if (args.includes("-s")) return { mode: "scrape" }
  if (args.includes("-o")) return { mode: "opencode" }
  if (args.includes("-w")) return { mode: "wiki" }
  return null
}

const scrapeOnly = async () => {
  console.log("Starting scrape-only mode\n")

  console.log("Crawling WordPress blog...")
  const posts = await crawlBlog()
  console.log(`Collected ${posts.length} posts\n`)

  const postGroups = groupPostsByDate(posts)
  console.log(`Found ${postGroups.length} unique dates\n`)

  for (const group of postGroups) {
    const dateStr = group.date.toISOString().split("T")[0]
    console.log(`Scraping ${dateStr}...`)
    const content = formatPostGroup(group)
    await writePostGroupContent(content, group.date)
    console.log(`✓ Scraped: ${dateStr}`)
  }

  console.log("\nScraping complete!")
}

const processWithOpenCodeOnly = async () => {
  console.log("Starting OpenCode-only mode\n")

  const config = await loadConfig()
  const prompt = await readFile(config.llm.promptFile, "utf-8")

  const earliestDate = new Date(config.earliestDate)
  const latestDate = config.latestDate ? new Date(config.latestDate) : null

  const ext = config.wordpress.outputFileExtension
  const files = await readdir(config.wordpress.outputDir)
  const contentFiles = files
    .filter((f) => f.endsWith(`_content.${ext}`))
    .filter((f) => {
      const dateStr = f.replace(`_content.${ext}`, "")
      const fileDate = new Date(dateStr)
      if (fileDate < earliestDate) return false
      if (latestDate && fileDate > latestDate) return false
      return true
    })
    .sort()
    .reverse()

  if (contentFiles.length === 0) {
    console.log("No content files found in date range. Run with -s first.")
    return
  }

  console.log(
    `Date range: ${earliestDate.toISOString().split("T")[0]} to ${latestDate?.toISOString().split("T")[0] ?? "now"}`,
  )
  console.log(`Found ${contentFiles.length} content files in range\n`)

  console.log(`Found ${contentFiles.length} content files\n`)

  await withOpenCodeServer(async () => {
    let processed = 0
    let failed = 0

    for (const file of contentFiles) {
      const dateStr = file.replace(`_content.${ext}`, "")
      processed++

      console.log(`${"=".repeat(50)}`)
      console.log(`Processing ${dateStr} (${processed}/${contentFiles.length})`)
      console.log(`${"=".repeat(50)}`)

      try {
        const inputPath = join(config.wordpress.outputDir, file)

        const { folder } = await parsePromptFrontmatter(config.llm.promptFile)
        const outputExt = config.llm.outputFileExtension
        const baseDir = config.llm.outputDir
        const outputDir = folder ? `${baseDir}/${folder}` : `${baseDir}/default`
        const outputPath = `${outputDir}/${dateStr}.output.${outputExt}`

        try {
          await mkdir(outputDir, { recursive: true })
        } catch (error) {
          if ((error as any).code !== "EEXIST") {
            throw error
          }
        }

        console.log("  → Processing with OpenCode...")
        await emptyFile(outputPath)
        await processWithOpenCode(
          inputPath,
          outputPath,
          prompt,
          config.llm.model,
        )

        console.log(`✓ Complete: ${dateStr}`)
      } catch (error) {
        failed++
        console.error(`❌ Failed: ${dateStr}`)
        console.error(`   ${(error as Error).message}`)
      }
    }

    console.log(`\n${"=".repeat(50)}`)
    console.log(
      `Done! Processed ${processed - failed}/${contentFiles.length} dates`,
    )
    if (failed > 0) {
      console.log(`Failed: ${failed} dates`)
    }
    console.log(`${"=".repeat(50)}\n`)
  })

  console.log("Processing complete!")
}

const wikiOnly = async () => {
  console.log("Testing wiki login...\n")
  await testWikiLogin()
  console.log("\nWiki test complete!")
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
      await scrapeOnly()
      break
    case "opencode":
      await processWithOpenCodeOnly()
      break
    case "wiki":
      await wikiOnly()
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
