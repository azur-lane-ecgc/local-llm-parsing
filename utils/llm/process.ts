import { spawn } from "node:child_process"
import { OPCODE_SERVER_URL } from "./server"

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
