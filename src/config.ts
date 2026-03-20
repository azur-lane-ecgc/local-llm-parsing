import { readFile } from "node:fs/promises"

interface Config {
  earliestDate: string
  latestDate?: string | false
  wordpress: {
    baseUrl: string
    pageAppendUrl: string
    outputDir: string
    outputFileExtension: string
  }
  llm: {
    model: string
    outputDir: string
    promptFile: string
    outputFileExtension: string
  }
  wikitext: {
    page: string
  }
}

export const loadConfig = async (): Promise<Config> => {
  const content = await readFile("./parser.config.json", "utf-8")
  return JSON.parse(content)
}
