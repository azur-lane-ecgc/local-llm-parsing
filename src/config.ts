import * as fs from "node:fs/promises"

interface Config {
  modelName: string
  lmStudioPort: number
  patchNotesDir: string
  llmOutputDir: string
  promptFile: string
  wordpress: {
    baseUrl: string
    pageAppendUrl: string
    earliestDate: string
  }
}

export const loadConfig = async (): Promise<Config> => {
  const content = await fs.readFile("./parser.config.json", "utf-8")
  return JSON.parse(content)
}
