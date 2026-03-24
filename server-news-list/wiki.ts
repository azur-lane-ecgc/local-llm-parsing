import { Mwn } from "mwn"
import { readFile, readdir } from "node:fs/promises"
import { loadConfig } from "../utils"

interface Config {
  earliestDate: string
  latestDate?: string | false
  model: string
  wiki: { page: string }
}

const OUTPUT_DIR = "server-news-list/outputs"

const api = new Mwn({
  apiUrl: process.env.WIKI_API_URL,
  username: process.env.WIKI_USERNAME,
  password: process.env.WIKI_PASSWORD,
  userAgent: process.env.WIKI_USER_AGENT,
})

const testServerNewsListWikiLogin = async () => {
  try {
    await api.login()
    const userInfo = await api.userinfo()
    console.log("Server news list wiki: Logged in successfully")
    console.log(userInfo)
  } catch (err) {
    console.error("Server news list wiki login failed:", err)
    throw err
  }
}

export const editServerNewsListPage = async (
  title: string,
  content: string,
): Promise<void> => {
  try {
    await api.save(title, content, "(automated edit) server news list added")
    console.log("Edited server news list page:", title)
  } catch (err) {
    console.error("Failed to edit server news list page:", err)
    throw err
  }
}

export const runServerNewsListWikiEdit = async () => {
  try {
    const config = await loadConfig<Config>("server-news-list/config.json")
    const wikitextPage = config.wiki.page
    await testServerNewsListWikiLogin()
    const allFiles = await readdir(OUTPUT_DIR)
    const wikitextFiles = allFiles
      .filter((f) => f.endsWith(".wikitext"))
      .sort((a, b) => b.localeCompare(a))
    const contents = await Promise.all(
      wikitextFiles.map((f) => readFile(`${OUTPUT_DIR}/${f}`, "utf-8")),
    )
    const combinedContent = contents.join("\n\n")
    await editServerNewsListPage(wikitextPage, combinedContent)
    console.log("Server news list wiki edit complete!")
  } catch (err) {
    console.error("Server news list wiki edit failed:", err)
    throw err
  }
}

if (import.meta.main) {
  runServerNewsListWikiEdit().catch((error) => {
    console.error("\nFatal Error:")
    console.error((error as Error).message)
    if ((error as Error).stack) {
      console.error("\nStack trace:")
      console.error((error as Error).stack)
    }
    process.exit(1)
  })
}
