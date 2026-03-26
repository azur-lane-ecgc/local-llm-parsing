import { readdir, readFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { withOpenCodeServer, processWithOpenCode, emptyFile } from "../utils"
import config from "./config.json" with { type: "json" }

const INPUT_DIR = "scrape/outputs"
const INPUT_EXT = "md"
const OUTPUT_DIR = "server-news-list/outputs"
const OUTPUT_EXT = "wikitext"
const PROMPT_FILE = "server-news-list/prompt.md"

const getLastThursday = (date: Date): Date => {
  const result = new Date(date.toISOString().slice(0, 10) + "T12:00:00")
  const dayOfWeek = result.getDay()
  const daysToGoBack = (dayOfWeek + 7 - 4) % 7
  result.setDate(result.getDate() - daysToGoBack)
  result.setHours(0, 0, 0, 0)
  return result
}

export const runServerNewsList = async () => {
  console.log("Starting server-news-list runner\n")

  const promptBase = await readFile(PROMPT_FILE, "utf-8")

  const latestDate = new Date(config.latestDate)
  const todayDateStr = latestDate.toISOString().split("T")[0]
  const prompt = `${promptBase}\n\nToday's date is ${todayDateStr}, for reference.`

  const ext = INPUT_EXT
  const files = await readdir(INPUT_DIR)
  const contentFiles = files
    .filter((f) => f.endsWith(`_content.${ext}`))
    .filter((f) => {
      const dateStr = f.replace(`_content.${ext}`, "")
      const fileDate = new Date(dateStr)
      return fileDate <= latestDate
    })
    .sort()
    .reverse()

  if (contentFiles.length === 0) {
    console.log("No content files found in date range.")
    return
  }

  const latestFiles = contentFiles.slice(0, 3)
  console.log(`Latest date: ${latestDate.toISOString().split("T")[0]}`)
  const latestDates = latestFiles.map((f) => f.replace(/_content\.\w+$/, ""))
  console.log(
    `Found ${contentFiles.length} files, using latest ${latestFiles.length} (${latestDates.join(", ")})\n`,
  )

  await mkdir(OUTPUT_DIR, { recursive: true })

  const lastThursday = getLastThursday(latestDate)
  const dateStr = lastThursday.toISOString().split("T")[0]
  const outputPath = `${OUTPUT_DIR}/${dateStr}-server-news.${OUTPUT_EXT}`

  const inputPaths = latestFiles.map((f) => join(INPUT_DIR, f))

  console.log(`Output: ${outputPath}`)
  console.log(`Inputs: ${inputPaths.join(", ")}\n`)

  await emptyFile(outputPath)
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
