import { Mwn } from "mwn"
import { readFile } from "node:fs/promises"
import { loadConfig } from "./config"

let config: Awaited<ReturnType<typeof loadConfig>> | null = null

const getConfig = async () => {
  if (!config) {
    config = await loadConfig()
  }
  return config
}

const api = new Mwn({
  apiUrl: process.env.WIKI_API_URL,
  username: process.env.WIKI_USERNAME,
  password: process.env.WIKI_PASSWORD,
  userAgent: process.env.WIKI_USER_AGENT,
})

export const testWikiLogin = async () => {
  try {
    await api.login()
    const userInfo = await api.userinfo()
    console.log("Logged in successfully")
    console.log(userInfo)
  } catch (err) {
    console.error("Login failed:", err)
    throw err
  }
}

export const readPage = async (title: string): Promise<string> => {
  try {
    const content = await new api.Page(title).text()
    console.log("Read page:", title)
    return content
  } catch (err) {
    console.error("Failed to read page:", err)
    throw err
  }
}

export const editPage = async (
  title: string,
  content: string,
): Promise<void> => {
  try {
    await api.save(title, content, "Automated edit")
    console.log("Edited page:", title)
  } catch (err) {
    console.error("Failed to edit page:", err)
    throw err
  }
}

export const runWikiEdit = async () => {
  try {
    await testWikiLogin()
    const cfg = await getConfig()
    const fileContent = await readFile(cfg.wikitext.filePath, "utf-8")
    await editPage(cfg.wikitext.page, fileContent)
    console.log("Wiki edit complete!")
  } catch (err) {
    console.error("Wiki edit failed:", err)
    throw err
  }
}

export const runWiki = async () => {
  console.log("Testing wiki login...\n")
  await testWikiLogin()
  const cfg = await getConfig()
  const content = await readPage(cfg.wikitext.page)
  console.log(content)
  console.log("\nWiki test complete!")
}
