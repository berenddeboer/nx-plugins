import * as childProcess from "node:child_process"
import type { ExecutorContext } from "@nx/devkit"
import type { KnipExecutorOptions } from "./schema"

export const BUN_UNAVAILABLE_ERROR =
  'Bun runtime requested but Bun is not available on PATH. Install Bun or set runtime to "node".'

export function isBunAvailable(): boolean {
  try {
    childProcess.execFileSync("bun", ["--version"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

/**
 * Executor - runs knip for a single project/workspace
 */
export default async function knipExecutor(
  options: KnipExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = options.projectRoot || "."
  const workspaceRoot = context.root

  if (options.runtime === "bun" && !isBunAvailable()) {
    console.error(BUN_UNAVAILABLE_ERROR)
    return { success: false }
  }

  const bin = options.runtime === "bun" ? "knip-bun" : "knip"
  const args = [bin, "--workspace", projectRoot]
  if (options.strict) args.push("--strict")

  const env = options.env ? { ...process.env, ...options.env } : process.env

  try {
    childProcess.execFileSync("npx", args, {
      stdio: "inherit",
      cwd: workspaceRoot,
      env,
    })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Knip check failed for ${projectRoot}: ${message}`)
    return { success: false }
  }
}
