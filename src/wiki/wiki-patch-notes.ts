import { Mwn } from "mwn"
import { readFile, readdir } from "node:fs/promises"

const WIKITEXT_PAGE = "User:Samheart564/Sandbox"

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
    await testPatchNotesWikiLogin()
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
    await editPatchNotesPage(WIKITEXT_PAGE, combinedContent)
    console.log("Patch notes wiki edit complete!")
  } catch (err) {
    console.error("Patch notes wiki edit failed:", err)
    throw err
  }
}
