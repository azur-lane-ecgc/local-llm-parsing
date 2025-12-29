import {
  crawlBlog,
  groupPostsByDate,
  formatPostGroup,
  writePostGroupContent,
} from "./src/wordpress-parser"
import { processWithAI, writeOutputFile, withLMServer } from "./src/ai-pipeline"
import { readFile } from "node:fs/promises"
import { loadConfig } from "./src/config"

const main = async () => {
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

main().catch((error) => {
  console.error("\nFatal Error:")
  console.error((error as Error).message)

  if ((error as Error).stack) {
    console.error("\nStack trace:")
    console.error((error as Error).stack)
  }

  process.exit(1)
})
