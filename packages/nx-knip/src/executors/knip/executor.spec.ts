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
  const options: KnipExecutorOptions = { projectRoot: "packages/proj", strict: true }
  const context = mockExecutorContext("knip")

  afterEach(() => {
    jest.restoreAllMocks()
    resetBunCache()
  })

  describe("when Bun is available", () => {
    beforeEach(() => {
      jest.spyOn(childProcess, "execSync").mockImplementation(() => {
        // Return empty buffer for bun --version check and knip-bun command
        return Buffer.from("")
      })
    })

    it("runs knip-bun with --workspace and --strict flags on project root", async () => {
      const result = await executor(options, context)

      expect(childProcess.execSync).toHaveBeenCalledWith("bun --version", {
        stdio: "ignore",
      })
      expect(childProcess.execSync).toHaveBeenCalledWith(
        'npx knip-bun --workspace "packages/proj" --strict',
        {
          stdio: "inherit",
          cwd: context.root,
          env: process.env,
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
        env: process.env,
      })
    })

    it("omits --strict flag when strict is not set", async () => {
      const nonStrictOptions: KnipExecutorOptions = { projectRoot: "packages/proj" }

      await executor(nonStrictOptions, context)

      expect(childProcess.execSync).toHaveBeenCalledWith(
        'npx knip-bun --workspace "packages/proj"',
        {
          stdio: "inherit",
          cwd: context.root,
          env: process.env,
        }
      )
    })

    it("merges env option into process.env", async () => {
      const envOptions: KnipExecutorOptions = {
        projectRoot: "packages/proj",
        env: { SQLITE_DATABASE_PATH: "/tmp/knip-dummy.db", PF_ORG: "examples/demo" },
      }

      await executor(envOptions, context)

      expect(childProcess.execSync).toHaveBeenCalledWith(
        'npx knip-bun --workspace "packages/proj"',
        {
          stdio: "inherit",
          cwd: context.root,
          env: {
            ...process.env,
            SQLITE_DATABASE_PATH: "/tmp/knip-dummy.db",
            PF_ORG: "examples/demo",
          },
        }
      )
    })
  })

  describe("when Bun is not available", () => {
    beforeEach(() => {
      jest.spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "bun --version") {
          throw new Error("bun not found")
        }
        return Buffer.from("")
      })
    })

    it("falls back to npx knip with --workspace and --strict flags", async () => {
      const result = await executor(options, context)

      expect(childProcess.execSync).toHaveBeenCalledWith("bun --version", {
        stdio: "ignore",
      })
      expect(childProcess.execSync).toHaveBeenCalledWith(
        'npx knip --workspace "packages/proj" --strict',
        {
          stdio: "inherit",
          cwd: context.root,
          env: process.env,
        }
      )
      expect(result.success).toBe(true)
    })
  })

  it("returns failure and logs error when knip check fails", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
      if (cmd === "bun --version") {
        return Buffer.from("")
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
