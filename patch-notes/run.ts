import { readFile, mkdir, readdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { withOpenCodeServer, processWithOpenCode } from "../utils"
import config from "./config.json" with { type: "json" }

const INPUT_DIR = "scrape/outputs"
const INPUT_EXT = "md"
const OUTPUT_DIR = "patch-notes/outputs"
const OUTPUT_EXT = "wikitext"
const PROMPT_FILE = "patch-notes/prompt.md"

const emptyFile = async (filePath: string): Promise<void> => {
  if (existsSync(filePath)) {
    await writeFile(filePath, "")
  }
}

export const runPatchNotes = async () => {
  console.log("Starting patch notes processing\n")

  const prompt = await readFile(PROMPT_FILE, "utf-8")

  const earliestDate = new Date(config.earliestDate)
  const latestDate =
    typeof config.latestDate === "string" ? new Date(config.latestDate) : null

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

  console.log(
    `Date range: ${earliestDate.toISOString().split("T")[0]} to ${latestDate?.toISOString().split("T")[0] ?? "now"}`,
  )
  console.log(`Found ${contentFiles.length} content files\n`)

  await withOpenCodeServer(async () => {
    let processed = 0
    let failed = 0

    for (const file of contentFiles) {
      const dateStr = file.replace(`_content.${ext}`, "")
      processed++

      console.log(`\n${"=".repeat(50)}`)
      console.log(`Processing ${dateStr} (${processed}/${contentFiles.length})`)
      console.log(`${"=".repeat(50)}`)

      try {
        const inputPath = join(INPUT_DIR, file)

        const outputPath = `${OUTPUT_DIR}/${dateStr}.output.${OUTPUT_EXT}`

        try {
          await mkdir(OUTPUT_DIR, { recursive: true })
        } catch (error) {
          if ((error as any).code !== "EEXIST") {
            throw error
          }
        }

        console.log("Processing with OpenCode...")
        await emptyFile(outputPath)
        await processWithOpenCode([inputPath], outputPath, prompt, config.model)

        console.log(`Complete: ${dateStr}`)
      } catch (error) {
        failed++
        console.error(`Failed: ${dateStr}`)
        console.error(`  ${(error as Error).message}`)
      }
    }

    console.log(`\n${"=".repeat(50)}`)
    console.log(
      `Done! Processed ${processed - failed}/${contentFiles.length} dates (${failed} failed)`,
    )
    console.log(`${"=".repeat(50)}\n`)
  })
}

if (import.meta.main) {
  runPatchNotes().catch((error) => {
    console.error("\nFatal Error:")
    console.error(error)
    process.exit(1)
  })
}
