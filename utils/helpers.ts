import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"

export const parsePromptFrontmatter = async (
  promptPath: string,
): Promise<{ folder?: string }> => {
  try {
    const content = await readFile(promptPath, "utf-8")
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return {}
    const frontmatter = match[1]
    const folderMatch = frontmatter?.match(/^folder:\s*(.+)$/m)
    return { folder: folderMatch?.[1]?.trim() }
  } catch {
    return {}
  }
}

export const emptyFile = async (filePath: string): Promise<void> => {
  if (existsSync(filePath)) {
    await writeFile(filePath, "")
  }
}

export const getLastThursday = (date: Date): Date => {
  const result = new Date(date.toISOString().slice(0, 10) + "T12:00:00")
  const dayOfWeek = result.getDay() // 0 = Sunday, 4 = Thursday
  const daysToGoBack = (dayOfWeek + 7 - 4) % 7
  result.setDate(result.getDate() - daysToGoBack)
  result.setHours(0, 0, 0, 0)
  return result
}
