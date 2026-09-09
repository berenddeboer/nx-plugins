import * as childProcess from "node:child_process"
import type { ExecutorContext, TaskGraph } from "@nx/devkit"
import { isBunAvailable } from "./executor"
import type { KnipExecutorOptions } from "./schema"

type BatchExecutorTaskResult = {
  task: string
  success: boolean
  terminalOutput: string
}

type CommandError = Error & {
  stdout?: unknown
  stderr?: unknown
}

function batchOptionsKey(options: KnipExecutorOptions | undefined): string {
  const env = Object.entries(options?.env ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  )
  return JSON.stringify({ strict: options?.strict === true, env })
}

/**
 * Batch executor - runs knip once per compatible task option group
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
  const taskGroups = new Map<string, typeof tasks>()

  for (const task of tasks) {
    const key = batchOptionsKey(options[task.id])
    const group = taskGroups.get(key) ?? []
    group.push(task)
    taskGroups.set(key, group)
  }

  const results: Record<string, BatchExecutorTaskResult> = {}

  for (const groupTasks of taskGroups.values()) {
    const groupOptions = options[groupTasks[0].id]
    const strict = groupOptions?.strict === true
    const uniqueRoots = [
      ...new Set(groupTasks.map((task) => options[task.id]?.projectRoot || ".")),
    ]
    const env = groupOptions?.env ? { ...process.env, ...groupOptions.env } : process.env

    const bin = isBunAvailable() ? "knip-bun" : "knip"
    const args = [bin]
    for (const root of uniqueRoots) {
      args.push("--workspace", root)
    }
    if (strict) args.push("--strict")

    let success = true
    let terminalOutput = ""

    try {
      const output = childProcess.execFileSync("npx", args, {
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
        const commandError = error as CommandError
        terminalOutput = String(commandError.stdout) + String(commandError.stderr || "")
        console.error(terminalOutput)
      } else {
        const msg = error instanceof Error ? error.message : String(error)
        terminalOutput = msg
        console.error(msg)
      }
    }

    for (const task of groupTasks) {
      results[task.id] = {
        task: task.id,
        success,
        terminalOutput,
      }
    }
  }

  return results
}
