import { spawn, ChildProcess } from "node:child_process"

export const OPCODE_SERVER_URL = "http://localhost:4096"

export const startOpenCodeServer = async (): Promise<ChildProcess> => {
  console.log("Starting OpenCode server...")
  const proc = spawn("opencode", ["serve"], { stdio: "inherit" })
  await waitForOpenCodeServer()
  return proc
}

export const waitForOpenCodeServer = async (
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
  inputPaths: string[],
  outputPath: string,
  prompt: string,
  model: string,
): Promise<void> => {
  console.log(`Running OpenCode on: ${inputPaths.join(", ")}`)

  const fullPrompt = `${prompt}\n\nWrite your output to: ${outputPath}`

  const proc = spawn(
    "opencode",
    [
      "run",
      "--attach=" + OPCODE_SERVER_URL,
      "-m",
      model,
      ...inputPaths.flatMap((p) => ["-f", p]),
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
