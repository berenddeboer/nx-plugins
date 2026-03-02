import { execFileSync } from "node:child_process"
import type { ExecutorContext, TaskGraph } from "@nx/devkit"
import type { KnipExecutorOptions } from "./schema"
import { isBunAvailable } from "./executor"

type BatchExecutorTaskResult = {
  task: string
  success: boolean
  terminalOutput: string
}

/**
 * Batch executor - runs knip once for all projects
 * This is invoked when using `nx affected -t knip --batch`
 */
export default async function knipBatchExecutor(
  taskGraph: TaskGraph,
  options: Record<string, KnipExecutorOptions>,
  _overrides: KnipExecutorOptions,
  context: ExecutorContext
): Promise<Record<string, BatchExecutorTaskResult>> {
  const tasks = Object.values(taskGraph.tasks)
  const workspaceRoot = context.root

  // Collect project roots from task options, deduplicate
  const projectRoots = tasks.map((task) => {
    const taskOptions = options[task.id]
    return taskOptions?.projectRoot || "."
  })
  const uniqueRoots = [...new Set(projectRoots)]

  // Use --strict if any task requests it
  const strict = tasks.some((task) => options[task.id]?.strict)

  // Merge env vars from all tasks
  const mergedEnv: Record<string, string> = {}
  for (const task of tasks) {
    const taskEnv = options[task.id]?.env
    if (taskEnv) {
      Object.assign(mergedEnv, taskEnv)
    }
  }
  const env =
    Object.keys(mergedEnv).length > 0 ? { ...process.env, ...mergedEnv } : process.env

  // Build args with --workspace flags
  const bin = isBunAvailable() ? "knip-bun" : "knip"
  const args = [bin]
  for (const r of uniqueRoots) {
    args.push("--workspace", r)
  }
  if (strict) args.push("--strict")

  let success = true
  let terminalOutput = ""

  try {
    const output = execFileSync("npx", args, {
      stdio: "pipe",
      cwd: workspaceRoot,
      encoding: "utf-8",
      env,
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

  // Return same result for all tasks
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
