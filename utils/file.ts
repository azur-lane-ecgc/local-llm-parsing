import { existsSync } from "node:fs"
import { writeFile } from "node:fs/promises"

export const emptyFile = async (filePath: string): Promise<void> => {
  if (existsSync(filePath)) {
    await writeFile(filePath, "")
  }
}
