import { Mwn } from "mwn"
import { readFile, readdir } from "node:fs/promises"
import { loadConfig } from "./config"

const WIKITEXT_PAGE = "User:Samheart564/Sandbox"

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

const testWikiLogin = async () => {
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

export const editPage = async (
  title: string,
  content: string,
): Promise<void> => {
  try {
    await api.save(title, content, "(automated edit) patch notes added")
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
    const allFiles = await readdir("output/llm/patch_notes")
    const wikitextFiles = allFiles
      .filter((f) => f.endsWith(".wikitext"))
      .sort((a, b) => b.localeCompare(a))
    const contents = await Promise.all(
      wikitextFiles.map((f) =>
        readFile(`output/llm/patch_notes/${f}`, "utf-8"),
      ),
    )
    const combinedContent = contents.join("\n\n")
    await editPage(WIKITEXT_PAGE, combinedContent)
    console.log("Wiki edit complete!")
  } catch (err) {
    console.error("Wiki edit failed:", err)
    throw err
  }
}
