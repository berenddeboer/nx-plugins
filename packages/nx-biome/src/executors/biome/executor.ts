import { execSync } from "node:child_process"
import type { ExecutorContext } from "@nx/devkit"
import type { BiomeExecutorOptions } from "./schema"

/**
 * Standard executor - runs biome check for a single project
 */
export default async function biomeExecutor(
  options: BiomeExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = options.projectRoot || "."
  const workspaceRoot = context.root

  try {
    execSync(`biome check ${projectRoot}`, {
      stdio: "inherit",
      cwd: workspaceRoot,
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}
