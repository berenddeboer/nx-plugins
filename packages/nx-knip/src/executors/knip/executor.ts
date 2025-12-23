import { execSync } from "node:child_process"
import type { ExecutorContext } from "@nx/devkit"
import type { KnipExecutorOptions } from "./schema"

/**
 * Check if Bun is available on the system
 */
function isBunAvailable(): boolean {
  try {
    execSync("bun --version", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
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
    execSync(`${command} --workspace ${projectRoot}`, {
      stdio: "inherit",
      cwd: workspaceRoot,
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}
