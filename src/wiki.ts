import { Mwn } from "mwn"

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

export const runWiki = async () => {
  console.log("Testing wiki login...\n")
  await testWikiLogin()
  console.log("\nWiki test complete!")
}
