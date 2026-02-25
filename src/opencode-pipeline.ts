import { spawn } from "bun"

const OPCODE_SERVER_URL = "http://localhost:4096"

export const startOpenCodeServer = async (): Promise<Bun.Subprocess> => {
  console.log(`→ Starting OpenCode server...`)

  const proc = spawn(["opencode", "serve"], {
    stdout: "inherit",
    stderr: "inherit",
  })

  await waitForOpenCodeServer()

  return proc
}

const waitForOpenCodeServer = async (
  timeoutMs: number = 30000,
): Promise<void> => {
  console.log(`  → Waiting for OpenCode server to be ready...`)

  const maxAttempts = timeoutMs / 1000
  const attemptDelay = 1000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${OPCODE_SERVER_URL}/global/health`, {
        signal: AbortSignal.timeout(2000),
      })

      if (response.ok) {
        console.log(`  ✓ OpenCode server ready`)
        return
      }
    } catch {}

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, attemptDelay))
    }
  }

  throw new Error(`OpenCode server not ready after ${timeoutMs}ms`)
}

export const stopOpenCodeServer = (process: Bun.Subprocess): void => {
  console.log(`→ Stopping OpenCode server...`)
  process.kill()
}

export const withOpenCodeServer = async <T>(
  callback: () => Promise<T>,
): Promise<T> => {
  let proc: Bun.Subprocess | undefined

  try {
    proc = await startOpenCodeServer()
    return await callback()
  } catch (error) {
    console.error(`❌ OpenCode Error: ${(error as Error).message}`)
    throw error
  } finally {
    if (proc) {
      try {
        stopOpenCodeServer(proc)
      } catch (cleanupError) {
        console.warn(`⚠️ Cleanup warning: ${(cleanupError as Error).message}`)
      }
    }
  }
}

export const processWithOpenCode = async (
  inputPath: string,
  outputPath: string,
  prompt: string,
): Promise<void> => {
  console.log(`→ Running OpenCode on: ${inputPath}`)

  const fullPrompt = `${prompt}\n\nWrite your output to: ${outputPath}`

  const proc = Bun.spawn(
    [
      "opencode",
      "run",
      "--attach=" + OPCODE_SERVER_URL,
      "-m",
      "zai-coding-plan/glm-5",
      "-f",
      inputPath,
      "--",
      fullPrompt,
    ],
    {
      stdout: "inherit",
      stderr: "inherit",
    },
  )

  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`OpenCode command failed with exit code ${exitCode}`)
  }
}
