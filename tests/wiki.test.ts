import { test, expect } from "bun:test"
import { readdir, readFile } from "node:fs/promises"

test("preview wiki content", async () => {
  const allFiles = await readdir("output/llm/patch_notes")
  const wikitextFiles = allFiles
    .filter((f) => f.endsWith(".wikitext"))
    .sort((a, b) => b.localeCompare(a))

  expect(wikitextFiles.length).toBeGreaterThan(0)

  console.log(`\nFound ${wikitextFiles.length} wikitext files:`)
  for (const f of wikitextFiles) {
    console.log(`  - ${f}`)
  }
  console.log("")

  const contents = await Promise.all(
    wikitextFiles.map((f) => readFile(`output/llm/patch_notes/${f}`, "utf-8")),
  )

  const combinedContent = contents.join("\n\n")

  console.log("=".repeat(60))
  console.log("CONTENT TO BE WRITTEN TO WIKI PAGE:")
  console.log("=".repeat(60))
  console.log("")
  console.log(combinedContent)
  console.log("")
  console.log("=".repeat(60))
  console.log(`Total length: ${combinedContent.length} characters\n`)
})
