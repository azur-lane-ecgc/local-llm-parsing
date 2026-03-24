import { readdir, readFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import {
  withOpenCodeServer,
  processWithOpenCode,
  loadConfig,
  getLastThursday,
} from "../utils"

interface Config {
  earliestDate: string
  latestDate?: string | false
  model: string
  wiki: { page: string }
}

const INPUT_DIR = "scrape/outputs"
const INPUT_EXT = "md"
const OUTPUT_DIR = "server-news-list/outputs"
const OUTPUT_EXT = "wikitext"
const PROMPT_FILE = "server-news-list/prompt.md"

export const runServerNewsList = async () => {
  console.log("Starting server-news-list runner\n")

  const config = await loadConfig<Config>("server-news-list/config.json")
  const prompt = await readFile(PROMPT_FILE, "utf-8")

  const earliestDate = new Date(config.earliestDate)
  const latestDate = config.latestDate ? new Date(config.latestDate) : null

  const ext = INPUT_EXT
  const files = await readdir(INPUT_DIR)
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
    console.log("No content files found in date range.")
    return
  }

  const latestFiles = contentFiles.slice(0, 3)
  console.log(
    `Date range: ${earliestDate.toISOString().split("T")[0]} to ${latestDate?.toISOString().split("T")[0] ?? "now"}`,
  )
  console.log(
    `Found ${contentFiles.length} files, using latest ${latestFiles.length}\n`,
  )

  await mkdir(OUTPUT_DIR, { recursive: true })

  const lastThursday = getLastThursday(earliestDate)
  const dateStr = lastThursday.toISOString().split("T")[0]
  const outputPath = `${OUTPUT_DIR}/${dateStr}-server-news.${OUTPUT_EXT}`

  const inputPaths = latestFiles.map((f) => join(INPUT_DIR, f))

  console.log(`Output: ${outputPath}`)
  console.log(`Inputs: ${inputPaths.join(", ")}\n`)

  await withOpenCodeServer(async () => {
    await processWithOpenCode(inputPaths, outputPath, prompt, config.model)
    console.log("\nDone!")
  })
}

if (import.meta.main) {
  runServerNewsList().catch((error) => {
    console.error("\nFatal Error:")
    console.error((error as Error).message)
    if ((error as Error).stack) {
      console.error("\nStack trace:")
      console.error((error as Error).stack)
    }
    process.exit(1)
  })
}
