import {
  crawlBlog,
  groupPostsByDate,
  formatPostGroup,
  writePostGroupContent,
} from "./src/wordpress-parser"
import { processWithAI, writeOutputFile, withLMServer } from "./src/ai-pipeline"
import { readFile, readdir } from "node:fs/promises"
import { loadConfig } from "./src/config"
import { join } from "node:path"

const parseArgs = (): { mode: "all" | "scrape" | "process" } => {
  const args = process.argv.slice(2)
  if (args.includes("-s")) return { mode: "scrape" }
  if (args.includes("-p")) return { mode: "process" }
  return { mode: "all" }
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

const processOnly = async () => {
  console.log("Starting process-only mode\n")

  const config = await loadConfig()
  const prompt = await readFile(config.promptFile, "utf-8")

  // Read existing content files
  const files = await readdir(config.patchNotesDir)
  const contentFiles = files
    .filter((f) => f.endsWith("_content.md"))
    .sort()
    .reverse()

  if (contentFiles.length === 0) {
    console.log("No content files found. Run with -s first.")
    return
  }

  console.log(`Found ${contentFiles.length} content files\n`)

  await withLMServer(async () => {
    let processed = 0
    let failed = 0

    for (const file of contentFiles) {
      const dateStr = file.replace("_content.md", "")
      const date = new Date(dateStr)
      processed++

      console.log(`${"=".repeat(50)}`)
      console.log(`Processing ${dateStr} (${processed}/${contentFiles.length})`)
      console.log(`${"=".repeat(50)}`)

      try {
        const content = await readFile(
          join(config.patchNotesDir, file),
          "utf-8",
        )

        console.log("  → Analyzing with AI...")
        const result = await processWithAI(content, prompt)
        await writeOutputFile(result, date)

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

const runAll = async () => {
  console.log("Starting Azur Lane Patch Notes Parser\n")

  const config = await loadConfig()

  console.log("Crawling WordPress blog...")
  const posts = await crawlBlog()
  console.log(`Collected ${posts.length} posts\n`)

  const postGroups = groupPostsByDate(posts)
  console.log(`Found ${postGroups.length} unique dates\n`)

  const prompt = await readFile(config.promptFile, "utf-8")

  await withLMServer(async () => {
    let processed = 0
    let failed = 0

    for (const group of postGroups) {
      const dateStr = group.date.toISOString().split("T")[0]
      processed++

      console.log(`${"=".repeat(50)}`)
      console.log(`Processing ${dateStr} (${processed}/${postGroups.length})`)
      console.log(`${"=".repeat(50)}`)

      try {
        const content = formatPostGroup(group)
        await writePostGroupContent(content, group.date)

        console.log("  → Analyzing with AI...")
        const result = await processWithAI(content, prompt)
        await writeOutputFile(result, group.date)

        console.log(`✓ Complete: ${dateStr}`)
      } catch (error) {
        failed++
        console.error(`❌ Failed: ${dateStr}`)
        console.error(`   ${(error as Error).message}`)
      }
    }

    console.log(`\n${"=".repeat(50)}`)
    console.log(
      `Done! Processed ${processed - failed}/${postGroups.length} dates`,
    )
    if (failed > 0) {
      console.log(`Failed: ${failed} dates`)
    }
    console.log(`${"=".repeat(50)}\n`)
  })

  console.log("Complete!")
}

const main = async () => {
  const { mode } = parseArgs()

  switch (mode) {
    case "scrape":
      await scrapeOnly()
      break
    case "process":
      await processOnly()
      break
    case "all":
      await runAll()
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
