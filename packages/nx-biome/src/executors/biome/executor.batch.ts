import { execSync } from "node:child_process"
import type { ExecutorContext, TaskGraph } from "@nx/devkit"
import type { BiomeExecutorOptions } from "./schema"

type BatchExecutorTaskResult = {
  task: string
  success: boolean
  terminalOutput: string
}

/**
 * Batch executor - runs biome check once for all projects
 * This is invoked when using `nx affected -t lint --batch`
 */
export default async function biomeBatchExecutor(
  taskGraph: TaskGraph,
  options: Record<string, BiomeExecutorOptions>,
  _overrides: BiomeExecutorOptions,
  context: ExecutorContext
): Promise<Record<string, BatchExecutorTaskResult>> {
  const tasks = Object.values(taskGraph.tasks)
  const workspaceRoot = context.root

  // Get project roots from task options (keyed by task ID)
  const projectRoots = tasks.map((task) => {
    const taskOptions = options[task.id]
    return taskOptions?.projectRoot || "."
  })

  // Dedupe and get unique project roots
  const uniqueRoots = [...new Set(projectRoots)]

  // Run biome once for all project directories
  const args = uniqueRoots.join(" ")
  let success = true
  let terminalOutput = ""

  try {
    // Run biome check on all project directories at once
    const output = execSync(`biome check ${args}`, {
      stdio: "pipe",
      cwd: workspaceRoot,
      encoding: "utf-8",
    })
    terminalOutput = output
    console.log(output)
  } catch (error) {
    success = false
    if (error && typeof error === "object" && "stdout" in error) {
      terminalOutput = String(error.stdout) + String(error.stderr || "")
      console.log(terminalOutput)
    }
  }

  // Return results for all tasks (they all share the same outcome)
  const results: Record<string, BatchExecutorTaskResult> = {}
  for (const task of tasks) {
    results[task.id] = {
      task: task.id,
      success,
      terminalOutput,
    }
  }

  return results
}
