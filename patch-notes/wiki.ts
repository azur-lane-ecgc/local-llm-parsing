import { Mwn } from "mwn"
import { readFile, readdir } from "node:fs/promises"
import config from "./config.json" with { type: "json" }

const OUTPUT_DIR = "patch-notes/outputs"

const api = new Mwn({
  apiUrl: process.env.WIKI_API_URL,
  username: process.env.WIKI_USERNAME,
  password: process.env.WIKI_PASSWORD,
  userAgent: process.env.WIKI_USER_AGENT,
})

const testPatchNotesWikiLogin = async () => {
  try {
    await api.login()
    const userInfo = await api.userinfo()
    console.log("Patch notes wiki: Logged in successfully")
    console.log(userInfo)
  } catch (err) {
    console.error("Patch notes wiki login failed:", err)
    throw err
  }
}

export const editPatchNotesPage = async (
  title: string,
  content: string,
): Promise<void> => {
  try {
    await api.save(title, content, "(automated edit) patch notes added")
    console.log("Edited patch notes page:", title)
  } catch (err) {
    console.error("Failed to edit patch notes page:", err)
    throw err
  }
}

export const runPatchNotesWikiEdit = async () => {
  try {
    const wikitextPage = config.wiki.page
    await testPatchNotesWikiLogin()
    const allFiles = await readdir(OUTPUT_DIR)
    const wikitextFiles = allFiles
      .filter((f) => f.endsWith(".wikitext"))
      .sort((a, b) => b.localeCompare(a))
    const contents = await Promise.all(
      wikitextFiles.map((f) => readFile(`${OUTPUT_DIR}/${f}`, "utf-8")),
    )
    const combinedContent = contents.join("\n\n")
    await editPatchNotesPage(wikitextPage, combinedContent)
    console.log("Patch notes wiki edit complete!")
  } catch (err) {
    console.error("Patch notes wiki edit failed:", err)
    throw err
  }
}

if (import.meta.main) {
  runPatchNotesWikiEdit().catch((error) => {
    console.error("\nFatal Error:")
    console.error((error as Error).message)
    if ((error as Error).stack) {
      console.error("\nStack trace:")
      console.error((error as Error).stack)
    }
    process.exit(1)
  })
}
