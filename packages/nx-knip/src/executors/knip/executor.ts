import { execSync } from "node:child_process"
import type { ExecutorContext } from "@nx/devkit"
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
function isBunAvailable(): boolean {
  if (bunAvailableCache === undefined) {
    try {
      execSync("bun --version", { stdio: "ignore" })
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
  const command = isBunAvailable() ? "npx knip-bun" : "npx knip"

  try {
    execSync(`${command} --workspace ${JSON.stringify(projectRoot)}`, {
      stdio: "inherit",
      cwd: workspaceRoot,
    })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Knip check failed for ${projectRoot}: ${message}`)
    return { success: false }
  }
}
