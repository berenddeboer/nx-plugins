import * as childProcess from "node:child_process"
import type { ExecutorContext } from "@nx/devkit"
import { runKnip } from "./knip-cli"
import type { KnipExecutorOptions } from "./schema"

/**
 * Cached result of Bun availability check.
 * undefined = not checked yet, boolean = cached result
 */
let bunAvailableCache: boolean | undefined

/**
 * Reset the Bun availability cache. Exported for testing purposes.
 */
export function resetBunCache(): void {
  bunAvailableCache = undefined
}

/**
 * Check if Bun is available on the system.
 * Result is cached since Bun availability won't change during a build.
 */
export function isBunAvailable(): boolean {
  if (bunAvailableCache === undefined) {
    try {
      childProcess.execFileSync("bun", ["--version"], {
        stdio: "ignore",
        windowsHide: true,
      })
      bunAvailableCache = true
    } catch {
      bunAvailableCache = false
    }
  }
  return bunAvailableCache
}

/**
 * Executor - runs knip for a single project/workspace
 * Uses knip-bun if Bun is available for better performance, otherwise falls back to knip
 */
export default async function knipExecutor(
  options: KnipExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = options.projectRoot || "."
  const workspaceRoot = context.root

  const cli = isBunAvailable() ? "knip-bun" : "knip"
  const args = ["--workspace", projectRoot]
  if (options.strict) args.push("--strict")

  const env = options.env ? { ...process.env, ...options.env } : process.env

  try {
    runKnip({
      workspaceRoot,
      cli,
      args,
      env,
      stdio: "inherit",
    })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Knip check failed for ${projectRoot}: ${message}`)
    return { success: false }
  }
}
