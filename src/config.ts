import { readFile } from "node:fs/promises"

interface Config {
  lmStudioModel: string
  opencodeModel: string
  lmStudioPort: number
  patchNotesDir: string
  llmOutputDir: string
  promptFile: string
  detailedSkin: boolean
  wordpress: {
    baseUrl: string
    pageAppendUrl: string
    earliestDate: string
  }
}

export const loadConfig = async (): Promise<Config> => {
  const content = await readFile("./parser.config.json", "utf-8")
  return JSON.parse(content)
}
