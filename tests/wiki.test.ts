import { test, expect } from "vitest"
import { readdir, readFile } from "node:fs/promises"
import { loadConfig } from "../src/config"
import { Mwn } from "mwn"

const api = new Mwn({
  apiUrl: process.env.WIKI_API_URL,
  username: process.env.WIKI_USERNAME,
  password: process.env.WIKI_PASSWORD,
  userAgent: process.env.WIKI_USER_AGENT,
})

test("wiki login", async () => {
  await api.login()
  const userInfo = await api.userinfo()
  expect(userInfo.id).toBeGreaterThan(0)
  console.log(`\nLogged in as: ${userInfo.name}`)
})

test("read wiki page", async () => {
  const cfg = await loadConfig()
  const content = await new api.Page(cfg.wikitext.page).text()
  expect(content.length).toBeGreaterThan(0)
  console.log(`\nPage: ${cfg.wikitext.page}`)
  console.log(`Length: ${content.length} characters`)
})

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
