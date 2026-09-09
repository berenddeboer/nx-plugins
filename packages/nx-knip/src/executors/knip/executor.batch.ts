import * as childProcess from "node:child_process"
import type { ExecutorContext, TaskGraph } from "@nx/devkit"
import { isBunAvailable } from "./executor"
import type { KnipExecutorOptions } from "./schema"

type BatchExecutorTaskResult = {
  task: string
  success: boolean
  terminalOutput: string
}

type ProcessResult = {
  success: boolean
  terminalOutput: string
}

function runKnip(
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const outputChunks: Buffer[] = []
    const child = childProcess.spawn("npx", args, {
      cwd,
      env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    })

    const collectOutput = (chunk: Buffer | string) => {
      outputChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    child.stdout.on("data", collectOutput)
    child.stderr.on("data", collectOutput)
    child.once("error", reject)
    child.once("close", (code) => {
      resolve({
        success: code === 0,
        terminalOutput: Buffer.concat(outputChunks).toString("utf8"),
      })
    })
  })
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

  let processResult: ProcessResult

  try {
    processResult = await runKnip(args, workspaceRoot, env)
    const log = processResult.success ? console.log : console.error
    log(processResult.terminalOutput)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    processResult = { success: false, terminalOutput: message }
    console.error(message)
  }

  // Return same result for all tasks
  const results: Record<string, BatchExecutorTaskResult> = {}
  for (const task of tasks) {
    results[task.id] = {
      task: task.id,
      success: processResult.success,
      terminalOutput: processResult.terminalOutput,
    }
  }

  return results
}
