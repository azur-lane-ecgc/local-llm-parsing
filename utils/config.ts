import { readFile } from "node:fs/promises"

export const loadConfig = async <T>(path: string): Promise<T> => {
  const content = await readFile(path, "utf-8")
  return JSON.parse(content)
}
