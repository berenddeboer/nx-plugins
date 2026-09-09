import type { ChildProcessWithoutNullStreams } from "node:child_process"
import * as childProcess from "node:child_process"
import { EventEmitter } from "node:events"
import { PassThrough } from "node:stream"
import type { ExecutorContext, TaskGraph } from "@nx/devkit"
import executor, { resetBunCache } from "./executor"
import batchExecutor from "./executor.batch"
import type { KnipExecutorOptions } from "./schema"

jest.mock("child_process")

interface MockProcessResult {
  stdout?: string | Buffer
  stderr?: string | Buffer
  code?: number | null
  signal?: NodeJS.Signals | null
  error?: Error
}

function mockSpawnResult(result: MockProcessResult): void {
  jest.spyOn(childProcess, "spawn").mockImplementation(() => {
    const child = new EventEmitter() as unknown as ChildProcessWithoutNullStreams
    const stdout = new PassThrough()
    const stderr = new PassThrough()
    child.stdin = new PassThrough()
    child.stdout = stdout
    child.stderr = stderr

    queueMicrotask(() => {
      if (result.stdout !== undefined) stdout.write(result.stdout)
      if (result.stderr !== undefined) stderr.write(result.stderr)
      stdout.end()
      stderr.end()

      if (result.error) {
        child.emit("error", result.error)
      } else {
        const code = result.code === undefined ? (result.signal ? null : 0) : result.code
        child.emit("close", code, result.signal ?? null)
      }
    })

    return child
  })
}

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
    jest.clearAllMocks()
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
    jest.clearAllMocks()
    jest.restoreAllMocks()
    resetBunCache()
  })

  describe("when Bun is available", () => {
    beforeEach(() => {
      jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
      mockSpawnResult({})
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

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "packages/projA", "--workspace", "packages/projB"],
        {
          cwd: context.root,
          env: process.env,
          shell: false,
          stdio: ["ignore", "pipe", "pipe"],
        }
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

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "npx",
        ["knip-bun", "--workspace", "packages/shared"],
        expect.objectContaining({ stdio: ["ignore", "pipe", "pipe"] })
      )
    })

    it("applies --strict if any task requests it", async () => {
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
        { id: "projB:knip", options: { projectRoot: "packages/projB", strict: true } },
      ])

      await batchExecutor(taskGraph, options, {} as KnipExecutorOptions, context)

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "npx",
        [
          "knip-bun",
          "--workspace",
          "packages/projA",
          "--workspace",
          "packages/projB",
          "--strict",
        ],
        expect.objectContaining({ stdio: ["ignore", "pipe", "pipe"] })
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

      expect(childProcess.spawn).toHaveBeenCalledWith(
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

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "npx",
        expect.any(Array),
        expect.objectContaining({ env: process.env })
      )
    })

    it("returns output larger than the synchronous process buffer limit", async () => {
      const terminalOutput = "x".repeat(1024 * 1024 + 1)
      jest.spyOn(childProcess, "execFileSync").mockImplementation(() => {
        throw new Error("stdout maxBuffer length exceeded")
      })
      mockSpawnResult({ stdout: terminalOutput })
      jest.spyOn(console, "log").mockImplementation()
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
      ])

      const results = await batchExecutor(
        taskGraph,
        options,
        {} as KnipExecutorOptions,
        context
      )

      expect(results["projA:knip"]).toMatchObject({
        task: "projA:knip",
        success: true,
      })
      expect(results["projA:knip"].terminalOutput).toHaveLength(1024 * 1024 + 1)
    })

    it("retains stderr from a successful Knip process", async () => {
      mockSpawnResult({ stderr: "configuration warning", code: 0 })
      jest.spyOn(console, "log").mockImplementation()
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
      ])

      const results = await batchExecutor(
        taskGraph,
        options,
        {} as KnipExecutorOptions,
        context
      )

      expect(results["projA:knip"]).toMatchObject({
        success: true,
        terminalOutput: "configuration warning",
      })
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
      mockSpawnResult({})
    })

    it("falls back to npx knip", async () => {
      const { taskGraph, options } = makeTaskGraph([
        { id: "projA:knip", options: { projectRoot: "packages/projA" } },
      ])

      await batchExecutor(taskGraph, options, {} as KnipExecutorOptions, context)

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "npx",
        ["knip", "--workspace", "packages/projA"],
        expect.objectContaining({
          stdio: ["ignore", "pipe", "pipe"],
          cwd: context.root,
        })
      )
    })
  })

  it("returns mixed stdout and stderr for a failed Knip process", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
    mockSpawnResult({
      stdout: "unused export found\n",
      stderr: "configuration warning\n",
      code: 1,
    })
    jest.spyOn(console, "error").mockImplementation()

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
    expect(results["projA:knip"].terminalOutput).toBe(
      "unused export found\nconfiguration warning\n"
    )
  })

  it("returns the spawn error when the Knip process cannot start", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
    mockSpawnResult({ error: new Error("spawn npx ENOENT") })
    jest.spyOn(console, "error").mockImplementation()
    const { taskGraph, options } = makeTaskGraph([
      { id: "projA:knip", options: { projectRoot: "packages/projA" } },
    ])

    const results = await batchExecutor(
      taskGraph,
      options,
      {} as KnipExecutorOptions,
      context
    )

    expect(results["projA:knip"]).toEqual({
      task: "projA:knip",
      success: false,
      terminalOutput: "spawn npx ENOENT",
    })
  })

  it("returns failure when the Knip process is terminated by a signal", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
    mockSpawnResult({ signal: "SIGTERM" })
    jest.spyOn(console, "error").mockImplementation()
    const { taskGraph, options } = makeTaskGraph([
      { id: "projA:knip", options: { projectRoot: "packages/projA" } },
    ])

    const results = await batchExecutor(
      taskGraph,
      options,
      {} as KnipExecutorOptions,
      context
    )

    expect(results["projA:knip"]).toEqual({
      task: "projA:knip",
      success: false,
      terminalOutput: "",
    })
  })

  it("returns an empty terminal output for a silent successful process", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => Buffer.from(""))
    mockSpawnResult({ code: 0 })
    jest.spyOn(console, "log").mockImplementation()
    const { taskGraph, options } = makeTaskGraph([
      { id: "projA:knip", options: { projectRoot: "packages/projA" } },
    ])

    const results = await batchExecutor(
      taskGraph,
      options,
      {} as KnipExecutorOptions,
      context
    )

    expect(results["projA:knip"]).toEqual({
      task: "projA:knip",
      success: true,
      terminalOutput: "",
    })
  })
})
