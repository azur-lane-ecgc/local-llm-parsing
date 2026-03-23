import { spawn, ChildProcess } from "node:child_process"
import { readFile, readdir, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { loadConfig } from "../config"
import { parsePromptFrontmatter, emptyFile } from "../utils"

const OPCODE_SERVER_URL = "http://localhost:4096"

export const startOpenCodeServer = async (): Promise<ChildProcess> => {
  console.log("Starting OpenCode server...")

  const proc = spawn("opencode", ["serve"], {
    stdio: "inherit",
  })

  await waitForOpenCodeServer()

  return proc
}

const waitForOpenCodeServer = async (
  timeoutMs: number = 30000,
): Promise<void> => {
  console.log("Waiting for OpenCode server to be ready...")

  const maxAttempts = timeoutMs / 1000
  const attemptDelay = 1000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${OPCODE_SERVER_URL}/global/health`, {
        signal: AbortSignal.timeout(2000),
      })

      if (response.ok) {
        console.log("OpenCode server ready")
        return
      }
    } catch {}

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, attemptDelay))
    }
  }

  throw new Error(`OpenCode server not ready after ${timeoutMs}ms`)
}

export const stopOpenCodeServer = (proc: ChildProcess): void => {
  console.log("Stopping OpenCode server...")
  proc.kill()
}

export const withOpenCodeServer = async <T>(
  callback: () => Promise<T>,
): Promise<T> => {
  let proc: ChildProcess | undefined

  try {
    proc = await startOpenCodeServer()
    return await callback()
  } catch (error) {
    console.error(`OpenCode Error: ${(error as Error).message}`)
    throw error
  } finally {
    if (proc) {
      try {
        stopOpenCodeServer(proc)
      } catch (cleanupError) {
        console.warn(`Cleanup warning: ${(cleanupError as Error).message}`)
      }
    }
  }
}

export const processWithOpenCode = async (
  inputPath: string,
  outputPath: string,
  prompt: string,
  model: string,
): Promise<void> => {
  console.log(`Running OpenCode on: ${inputPath}`)

  const fullPrompt = `${prompt}\n\nWrite your output to: ${outputPath}`

  const proc = spawn(
    "opencode",
    [
      "run",
      "--attach=" + OPCODE_SERVER_URL,
      "-m",
      model,
      "-f",
      inputPath,
      "--",
      fullPrompt,
    ],
    {
      stdio: "inherit",
    },
  )

  const exitCode = await new Promise<number>((resolve) => {
    proc.on("close", resolve)
  })
  if (exitCode !== 0) {
    throw new Error(`OpenCode command failed with exit code ${exitCode}`)
  }
}

export const runOpenCode = async () => {
  console.log("Starting OpenCode-only mode\n")

  const config = await loadConfig()
  const prompt = await readFile(config.llm.promptFile, "utf-8")

  const earliestDate = new Date(config.earliestDate)
  const latestDate = config.latestDate ? new Date(config.latestDate) : null

  const ext = config.wordpress.outputFileExtension
  const files = await readdir(config.wordpress.outputDir)
  const contentFiles = files
    .filter((f) => f.endsWith(`_content.${ext}`))
    .filter((f) => {
      const dateStr = f.replace(`_content.${ext}`, "")
      const fileDate = new Date(dateStr)
      if (fileDate < earliestDate) return false
      if (latestDate && fileDate > latestDate) return false
      return true
    })
    .sort()
    .reverse()

  if (contentFiles.length === 0) {
    console.log("No content files found in date range. Run with -s first.")
    return
  }

  console.log(
    `Date range: ${earliestDate.toISOString().split("T")[0]} to ${latestDate?.toISOString().split("T")[0] ?? "now"}`,
  )
  console.log(`Found ${contentFiles.length} content files\n`)

  await withOpenCodeServer(async () => {
    let processed = 0
    let failed = 0

    for (const file of contentFiles) {
      const dateStr = file.replace(`_content.${ext}`, "")
      processed++

      console.log(`\n${"=".repeat(50)}`)
      console.log(`Processing ${dateStr} (${processed}/${contentFiles.length})`)
      console.log(`${"=".repeat(50)}`)

      try {
        const inputPath = join(config.wordpress.outputDir, file)

        const { folder } = await parsePromptFrontmatter(config.llm.promptFile)
        const outputExt = config.llm.outputFileExtension
        const baseDir = config.llm.outputDir
        const outputDir = folder ? `${baseDir}/${folder}` : `${baseDir}/default`
        const outputPath = `${outputDir}/${dateStr}.output.${outputExt}`

        try {
          await mkdir(outputDir, { recursive: true })
        } catch (error) {
          if ((error as any).code !== "EEXIST") {
            throw error
          }
        }

        console.log("Processing with OpenCode...")
        await emptyFile(outputPath)
        await processWithOpenCode(
          inputPath,
          outputPath,
          prompt,
          config.llm.model,
        )

        console.log(`Complete: ${dateStr}`)
      } catch (error) {
        failed++
        console.error(`Failed: ${dateStr}`)
        console.error(`  ${(error as Error).message}`)
      }
    }

    console.log(`\n${"=".repeat(50)}`)
    console.log(
      `Done! Processed ${processed - failed}/${contentFiles.length} dates (${failed} failed)`,
    )
    console.log(`${"=".repeat(50)}\n`)
  })
}

if (import.meta.main) {
  runOpenCode().catch((error) => {
    console.error("\nFatal Error:")
    console.error((error as Error).message)
    if ((error as Error).stack) {
      console.error("\nStack trace:")
      console.error((error as Error).stack)
    }
    process.exit(1)
  })
}
