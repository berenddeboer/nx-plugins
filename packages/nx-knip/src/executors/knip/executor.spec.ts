import * as childProcess from "node:child_process"
import type { ExecutorContext, TaskGraph } from "@nx/devkit"

import executor, { resetBunCache } from "./executor"
import batchExecutor from "./executor.batch"
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
      jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
      jest.spyOn(childProcess, "execFileSync").mockImplementation(() => Buffer.from(""))
    })

    it("runs knip-bun with --workspace and --strict flags on project root", async () => {
      const result = await executor(options, context)

      expect(childProcess.execSync).toHaveBeenCalledWith("bun --version", {
        stdio: "ignore",
      })
      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "packages/proj", "--strict"],
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

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "."],
        {
          stdio: "inherit",
          cwd: context.root,
          env: process.env,
        }
      )
    })

    it("omits --strict flag when strict is not set", async () => {
      const nonStrictOptions: KnipExecutorOptions = { projectRoot: "packages/proj" }

      await executor(nonStrictOptions, context)

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "packages/proj"],
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

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "packages/proj"],
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
      jest.spyOn(childProcess, "execFileSync").mockImplementation(() => Buffer.from(""))
    })

    it("falls back to npx knip with --workspace and --strict flags", async () => {
      const result = await executor(options, context)

      expect(childProcess.execSync).toHaveBeenCalledWith("bun --version", {
        stdio: "ignore",
      })
      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip", "--workspace", "packages/proj", "--strict"],
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
    jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
    jest.spyOn(childProcess, "execFileSync").mockImplementation(() => {
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

describe("nx-knip batch executor", () => {
  const context = mockExecutorContext("knip")

  function makeTaskGraph(
    taskEntries: Array<{ id: string; options: KnipExecutorOptions }>
  ): { taskGraph: TaskGraph; options: Record<string, KnipExecutorOptions> } {
    const tasks: TaskGraph["tasks"] = {}
    const optionsMap: Record<string, KnipExecutorOptions> = {}
    const dependencies: TaskGraph["dependencies"] = {}

    for (const entry of taskEntries) {
      tasks[entry.id] = {
        id: entry.id,
        target: { project: entry.id.split(":")[0], target: "knip" },
        outputs: [],
        overrides: {},
        parallelism: true,
      }
      optionsMap[entry.id] = entry.options
      dependencies[entry.id] = []
    }

    return {
      taskGraph: {
        roots: Object.keys(tasks),
        tasks,
        dependencies,
        continuousDependencies: {},
      },
      options: optionsMap,
    }
  }

  afterEach(() => {
    jest.restoreAllMocks()
    resetBunCache()
  })

  describe("when Bun is available", () => {
    beforeEach(() => {
      jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
      jest.spyOn(childProcess, "execFileSync").mockImplementation(() => "")
    })

    it("runs knip-bun with multiple --workspace flags", async () => {
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
        { id: "projB:knip", options: { projectRoot: "packages/projB" } },
      ])

      const results = await batchExecutor(
        taskGraph,
        options,
        {} as KnipExecutorOptions,
        context
      )

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "packages/projA", "--workspace", "packages/projB"],
        expect.objectContaining({ stdio: "pipe", cwd: context.root })
      )
      expect(results["projA:knip"].success).toBe(true)
      expect(results["projB:knip"].success).toBe(true)
    })

    it("deduplicates project roots", async () => {
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/shared" } },
        { id: "projB:knip", options: { projectRoot: "packages/shared" } },
      ])

      await batchExecutor(taskGraph, options, {} as KnipExecutorOptions, context)

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "packages/shared"],
        expect.objectContaining({ stdio: "pipe" })
      )
    })

    it("applies --strict if any task requests it", async () => {
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
        { id: "projB:knip", options: { projectRoot: "packages/projB", strict: true } },
      ])

      await batchExecutor(taskGraph, options, {} as KnipExecutorOptions, context)

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        [
          "knip-bun",
          "--workspace",
          "packages/projA",
          "--workspace",
          "packages/projB",
          "--strict",
        ],
        expect.objectContaining({ stdio: "pipe" })
      )
    })

    it("merges env vars from all tasks", async () => {
      const { taskGraph, options } = makeTaskGraph([
        {
          id: "projA:knip",
          options: { projectRoot: "packages/projA", env: { VAR_A: "a" } },
        },
        {
          id: "projB:knip",
          options: { projectRoot: "packages/projB", env: { VAR_B: "b" } },
        },
      ])

      await batchExecutor(taskGraph, options, {} as KnipExecutorOptions, context)

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({ VAR_A: "a", VAR_B: "b" }),
        })
      )
    })

    it("uses process.env when no tasks have env vars", async () => {
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
      ])

      await batchExecutor(taskGraph, options, {} as KnipExecutorOptions, context)

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        expect.any(Array),
        expect.objectContaining({ env: process.env })
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
      jest.spyOn(childProcess, "execFileSync").mockImplementation(() => "")
    })

    it("falls back to npx knip", async () => {
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
      ])

      await batchExecutor(taskGraph, options, {} as KnipExecutorOptions, context)

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "npx",
        ["knip", "--workspace", "packages/projA"],
        expect.objectContaining({ stdio: "pipe", cwd: context.root })
      )
    })
  })

  it("propagates failure to all tasks", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
    jest.spyOn(childProcess, "execFileSync").mockImplementation(() => {
      const error = new Error("knip failed") as Error & { stdout: string; stderr: string }
      error.stdout = "unused export found"
      error.stderr = ""
      throw error
    })
    jest.spyOn(console, "log").mockImplementation()

    const { taskGraph, options } = makeTaskGraph([
      { id: "projA:knip", options: { projectRoot: "packages/projA" } },
      { id: "projB:knip", options: { projectRoot: "packages/projB" } },
    ])

    const results = await batchExecutor(
      taskGraph,
      options,
      {} as KnipExecutorOptions,
      context
    )

    expect(results["projA:knip"].success).toBe(false)
    expect(results["projB:knip"].success).toBe(false)
    expect(results["projA:knip"].terminalOutput).toContain("unused export found")
  })
})
