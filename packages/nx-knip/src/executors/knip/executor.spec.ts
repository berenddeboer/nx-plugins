import * as childProcess from "node:child_process"
import type { ExecutorContext } from "@nx/devkit"

import executor, { resetBunCache } from "./executor"
import type { KnipExecutorOptions } from "./schema"

function mockExecutorContext(executorName: string): ExecutorContext {
  return {
    root: "/root",
    cwd: "/root",
    isVerbose: false,
    projectName: "proj",
    nxJsonConfiguration: {},
    projectsConfigurations: {
      version: 2,
      projects: {
        proj: {
          root: "packages/proj",
          targets: {
            knip: {
              executor: `@berenddeboer/nx-knip:${executorName}`,
            },
          },
        },
      },
    },
    projectGraph: {
      nodes: {
        proj: {
          type: "lib",
          name: "proj",
          data: {
            root: "packages/proj",
          },
        },
      },
      dependencies: {},
    },
    target: {
      executor: `@berenddeboer/nx-knip:${executorName}`,
    },
  }
}

describe("nx-knip executor", () => {
  const options: KnipExecutorOptions = { projectRoot: "packages/proj" }
  const context = mockExecutorContext("knip")

  afterEach(() => {
    jest.clearAllMocks()
    resetBunCache()
  })

  describe("when Bun is available", () => {
    beforeEach(() => {
      jest.spyOn(childProcess, "execSync").mockImplementation(() => {
        // Return empty string for bun --version check and knip-bun command
        return ""
      })
    })

    it("runs knip-bun with --workspace flag on project root", async () => {
      const result = await executor(options, context)

      expect(childProcess.execSync).toHaveBeenCalledWith("bun --version", {
        stdio: "ignore",
      })
      expect(childProcess.execSync).toHaveBeenCalledWith(
        'npx knip-bun --workspace "packages/proj"',
        {
          stdio: "inherit",
          cwd: context.root,
        }
      )
      expect(result.success).toBe(true)
    })

    it("defaults to current directory when projectRoot is not provided", async () => {
      const emptyOptions = {} as KnipExecutorOptions

      await executor(emptyOptions, context)

      expect(childProcess.execSync).toHaveBeenCalledWith('npx knip-bun --workspace "."', {
        stdio: "inherit",
        cwd: context.root,
      })
    })
  })

  describe("when Bun is not available", () => {
    beforeEach(() => {
      jest.spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "bun --version") {
          throw new Error("bun not found")
        }
        return ""
      })
    })

    it("falls back to npx knip with --workspace flag", async () => {
      const result = await executor(options, context)

      expect(childProcess.execSync).toHaveBeenCalledWith("bun --version", {
        stdio: "ignore",
      })
      expect(childProcess.execSync).toHaveBeenCalledWith(
        'npx knip --workspace "packages/proj"',
        {
          stdio: "inherit",
          cwd: context.root,
        }
      )
      expect(result.success).toBe(true)
    })
  })

  it("returns failure and logs error when knip check fails", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
      if (cmd === "bun --version") {
        return ""
      }
      throw new Error("Knip check failed")
    })
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    const result = await executor(options, context)

    expect(result.success).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith(
      "Knip check failed for packages/proj: Knip check failed"
    )
  })
})
