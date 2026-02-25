import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { streamText } from "ai"
import { mkdir, readFile } from "node:fs/promises"
import { exec } from "node:child_process"
import { promisify } from "node:util"
import { loadConfig } from "./config"

const execAsync = promisify(exec)

const parsePromptFrontmatter = async (
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

let config: Awaited<ReturnType<typeof loadConfig>> | null = null

const getConfig = async () => {
  if (!config) {
    config = await loadConfig()
  }
  return config
}

const execCommand = async (
  cmd: string,
  timeout: number = 300000,
): Promise<{ stdout: string; stderr: string }> => {
  try {
    return await execAsync(cmd, { timeout })
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      throw new Error(
        "LM Studio CLI not installed. Install from: https://lmstudio.ai/",
      )
    }
    throw error
  }
}

const loadModel = async (model: string): Promise<void> => {
  console.log(`  → Loading model: ${model}...`)

  const { stdout } = await execCommand(`lms ps`)

  if (stdout.includes(model)) {
    console.log(`  ✓ Model already loaded`)
    return
  }

  const { stderr } = await execCommand(`lms load ${model}`)

  const isError =
    stderr.toLowerCase().includes("error") ||
    stderr.toLowerCase().includes("failed") ||
    stderr.toLowerCase().includes("command not found")

  if (isError) {
    throw new Error(`lms load failed: ${stderr}`)
  }

  console.log(`  ✓ Model loaded`)
}

const startServer = async (port: number): Promise<void> => {
  console.log(`  → Starting server on port ${port}...`)

  try {
    const response = await fetch(`http://localhost:${port}/v1/models`, {
      signal: AbortSignal.timeout(2000),
    })

    if (response.ok) {
      console.log(`  ✓ Server already running`)
      return
    }
  } catch {}

  await execCommand(`lms server start --port ${port}`)

  console.log(`  ✓ Server started`)
}

const waitForServer = async (
  port: number,
  timeoutMs: number = 100000,
): Promise<void> => {
  console.log(`  → Waiting for server to be ready...`)

  const maxAttempts = 10
  const attemptDelay = 10000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:${port}/v1/models`, {
        signal: AbortSignal.timeout(2000),
      })

      if (response.ok) {
        console.log(`  ✓ Server ready`)
        return
      }
    } catch {}

    if (attempt < maxAttempts - 1) {
      console.log(`    → Retrying in ${attemptDelay / 1000}s...`)
      await new Promise((resolve) => setTimeout(resolve, attemptDelay))
    }
  }

  throw new Error(
    `LM Studio server not ready after ${timeoutMs}ms (${maxAttempts} attempts)`,
  )
}

const stopServer = async (): Promise<void> => {
  console.log(`  → Stopping LM Studio server...`)

  try {
    await execCommand(`lms server stop`)
  } catch {
    // Ignore errors if server already stopped
  }

  console.log(`  ✓ Server stopped`)
}

const unloadModel = async (_model: string): Promise<void> => {
  console.log(`  → Unloading model...`)

  try {
    await execCommand(`lms unload`)
  } catch {
    // Ignore errors if model already unloaded
  }

  console.log(`  ✓ Model unloaded`)
}

export const withLMServer = async <T>(
  callback: () => Promise<T>,
): Promise<T> => {
  const cfg = await getConfig()

  try {
    await loadModel(cfg.modelName)
    await startServer(cfg.lmStudioPort)
    await waitForServer(cfg.lmStudioPort)

    return await callback()
  } catch (error) {
    console.error(`❌ LM Studio Error: ${(error as Error).message}`)

    const errorMsg = (error as Error).message.toLowerCase()

    if (errorMsg.includes("command not found") || errorMsg.includes("enoent")) {
      throw new Error(
        "LM Studio CLI not installed. Install from: https://lmstudio.ai/",
      )
    }

    if (errorMsg.includes("model not found")) {
      throw new Error(
        `Model "${cfg.modelName}" not found. Run 'lms ls' to see available models.`,
      )
    }

    throw error
  } finally {
    try {
      await unloadModel(cfg.modelName)
      await stopServer()
    } catch (cleanupError) {
      console.warn(`⚠️ Cleanup warning: ${(cleanupError as Error).message}`)
    }
  }
}

export const processWithAI = async (
  content: string,
  prompt: string,
): Promise<string> => {
  const cfg = await getConfig()
  const lmstudio = createOpenAICompatible({
    name: "lmstudio",
    baseURL: `http://localhost:${cfg.lmStudioPort}/v1`,
  })

  console.log(`  → Sending content to AI (${content.length} characters)...`)

  const result = streamText({
    model: lmstudio(cfg.modelName),
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: content },
    ],
  })

  process.stdout.write(`\n  → AI Response:\n`)
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart)
  }
  process.stdout.write("\n\n")

  console.log(`  ✓ AI response received`)

  const text = await result.text

  return text
}

/**
 * Writes markdown output to LLM_OUTPUT_DIR/YYYY-MM-DD.output.md.
 * Overwrites existing file if it exists.
 */
export const writeOutputFile = async (
  markdown: string,
  date: Date,
): Promise<void> => {
  const cfg = await getConfig()
  const { folder } = await parsePromptFrontmatter(cfg.promptFile)

  // Build output dir: output/llm/<folder> or output/llm/default
  const baseDir = "output/llm"
  const outputDir = folder ? `${baseDir}/${folder}` : `${baseDir}/default`

  const dateStr = date.toISOString().split("T")[0]
  const filename = `${outputDir}/${dateStr}.output.md`

  try {
    await mkdir(outputDir, { recursive: true })
  } catch (error) {
    if ((error as any).code !== "EEXIST") {
      throw error
    }
  }

  await Bun.write(filename, markdown)

  console.log(`  ✓ Saved to: ${filename}`)
}
