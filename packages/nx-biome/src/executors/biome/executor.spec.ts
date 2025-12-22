import * as childProcess from "child_process"
import type { ExecutorContext, TaskGraph } from "@nx/devkit"

import executor from "./executor"
import batchExecutor from "./executor.batch"
import type { BiomeExecutorOptions } from "./schema"

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
          root: "apps/proj",
          targets: {
            lint: {
              executor: `@berenddeboer/nx-biome:${executorName}`,
            },
          },
        },
      },
    },
    projectGraph: {
      nodes: {
        proj: {
          type: "app",
          name: "proj",
          data: {
            root: "apps/proj",
          },
        },
      },
      dependencies: {},
    },
    target: {
      executor: `@berenddeboer/nx-biome:${executorName}`,
    },
  }
}

describe("nx-biome executor", () => {
  const options: BiomeExecutorOptions = { projectRoot: "apps/proj" }
  const context = mockExecutorContext("biome")

  beforeEach(() => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => "")
  })

  afterEach(() => jest.clearAllMocks())

  it("runs biome check on project root", async () => {
    const result = await executor(options, context)

    expect(childProcess.execSync).toHaveBeenCalledWith("biome check apps/proj", {
      stdio: "inherit",
      cwd: context.root,
    })
    expect(result.success).toBe(true)
  })

  it("defaults to current directory when projectRoot is not provided", async () => {
    const emptyOptions = {} as BiomeExecutorOptions

    await executor(emptyOptions, context)

    expect(childProcess.execSync).toHaveBeenCalledWith("biome check .", {
      stdio: "inherit",
      cwd: context.root,
    })
  })

  it("returns failure when biome check fails", async () => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => {
      throw new Error("Biome check failed")
    })

    const result = await executor(options, context)

    expect(result.success).toBe(false)
  })
})

describe("nx-biome batch executor", () => {
  const context = mockExecutorContext("biome")

  beforeEach(() => {
    jest.spyOn(childProcess, "execSync").mockImplementation(() => "")
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => jest.clearAllMocks())

  it("runs biome check on all project roots at once", async () => {
    const taskGraph: TaskGraph = {
      roots: ["proj:lint", "lib:lint"],
      tasks: {
        "proj:lint": {
          id: "proj:lint",
          target: { project: "proj", target: "lint" },
          overrides: {},
          outputs: [],
          parallelism: true,
        },
        "lib:lint": {
          id: "lib:lint",
          target: { project: "lib", target: "lint" },
          overrides: {},
          outputs: [],
          parallelism: true,
        },
      },
      dependencies: {},
      continuousDependencies: {},
    }

    const options: Record<string, BiomeExecutorOptions> = {
      "proj:lint": { projectRoot: "apps/proj" },
      "lib:lint": { projectRoot: "libs/lib" },
    }

    const results = await batchExecutor(
      taskGraph,
      options,
      {} as BiomeExecutorOptions,
      context
    )

    expect(childProcess.execSync).toHaveBeenCalledWith(
      "biome check apps/proj libs/lib",
      expect.objectContaining({
        stdio: "pipe",
        cwd: context.root,
        encoding: "utf-8",
      })
    )
    expect(results["proj:lint"].success).toBe(true)
    expect(results["lib:lint"].success).toBe(true)
  })

  it("deduplicates project roots", async () => {
    const taskGraph: TaskGraph = {
      roots: ["proj:lint", "proj2:lint"],
      tasks: {
        "proj:lint": {
          id: "proj:lint",
          target: { project: "proj", target: "lint" },
          overrides: {},
          outputs: [],
          parallelism: true,
        },
        "proj2:lint": {
          id: "proj2:lint",
          target: { project: "proj2", target: "lint" },
          overrides: {},
          outputs: [],
          parallelism: true,
        },
      },
      dependencies: {},
      continuousDependencies: {},
    }

    const options: Record<string, BiomeExecutorOptions> = {
      "proj:lint": { projectRoot: "apps/proj" },
      "proj2:lint": { projectRoot: "apps/proj" }, // Same root
    }

    await batchExecutor(taskGraph, options, {} as BiomeExecutorOptions, context)

    expect(childProcess.execSync).toHaveBeenCalledWith(
      "biome check apps/proj",
      expect.objectContaining({
        stdio: "pipe",
        cwd: context.root,
      })
    )
  })

  it("returns failure for all tasks when biome check fails", async () => {
    const error = new Error("Biome check failed") as Error & {
      stdout: string
      stderr: string
    }
    error.stdout = "Linting errors found"
    error.stderr = ""

    jest.spyOn(childProcess, "execSync").mockImplementation(() => {
      throw error
    })

    const taskGraph: TaskGraph = {
      roots: ["proj:lint", "lib:lint"],
      tasks: {
        "proj:lint": {
          id: "proj:lint",
          target: { project: "proj", target: "lint" },
          overrides: {},
          outputs: [],
          parallelism: true,
        },
        "lib:lint": {
          id: "lib:lint",
          target: { project: "lib", target: "lint" },
          overrides: {},
          outputs: [],
          parallelism: true,
        },
      },
      dependencies: {},
      continuousDependencies: {},
    }

    const options: Record<string, BiomeExecutorOptions> = {
      "proj:lint": { projectRoot: "apps/proj" },
      "lib:lint": { projectRoot: "libs/lib" },
    }

    const results = await batchExecutor(
      taskGraph,
      options,
      {} as BiomeExecutorOptions,
      context
    )

    expect(results["proj:lint"].success).toBe(false)
    expect(results["lib:lint"].success).toBe(false)
    expect(results["proj:lint"].terminalOutput).toContain("Linting errors found")
  })
})
