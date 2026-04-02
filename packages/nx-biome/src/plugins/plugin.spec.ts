import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { CreateNodesContext } from "@nx/devkit"
import { createNodesV2 } from "./plugin"

describe("@berenddeboer/nx-biome/plugin", () => {
  const createNodesFunction = createNodesV2[1]
  let context: CreateNodesContext
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "nx-biome-test"))
    context = {
      nxJsonConfiguration: {},
      workspaceRoot: tempDir,
      configFiles: [],
    }
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  function createProjectJson(projectRoot: string) {
    const dir = join(tempDir, projectRoot)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "project.json"), JSON.stringify({ name: projectRoot }))
  }

  function createPackageJson(projectRoot: string) {
    const dir = join(tempDir, projectRoot)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: projectRoot }))
  }

  it("should infer lint target for a project.json-based project", async () => {
    createProjectJson("packages/my-lib")
    const nodes = await createNodesFunction(["packages/my-lib/project.json"], {}, context)
    const project = nodes[0][1].projects["packages/my-lib"]

    expect(project.targets).toHaveProperty("lint")
    expect(project.targets.lint.executor).toBe("@berenddeboer/nx-biome:biome")
  })

  it("should infer lint target for a package.json-inferred project", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(["packages/my-lib/package.json"], {}, context)
    const project = nodes[0][1].projects["packages/my-lib"]

    expect(project.targets).toHaveProperty("lint")
    expect(project.targets.lint.executor).toBe("@berenddeboer/nx-biome:biome")
  })

  it("should use custom target name for package.json-inferred project", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(
      ["packages/my-lib/package.json"],
      { targetName: "biome-lint" },
      context
    )
    const project = nodes[0][1].projects["packages/my-lib"]

    expect(project.targets).toHaveProperty("biome-lint")
    expect(project.targets).not.toHaveProperty("lint")
  })

  it("should skip root package.json", async () => {
    writeFileSync(join(tempDir, "package.json"), JSON.stringify({ name: "root" }))
    const nodes = await createNodesFunction(["package.json"], {}, context)

    expect(nodes[0][1]).toEqual({})
  })

  it("should skip node_modules", async () => {
    const nodes = await createNodesFunction(
      ["node_modules/some-pkg/package.json"],
      {},
      context
    )

    expect(nodes[0][1]).toEqual({})
  })

  it("should set projectRoot in executor options for package.json-inferred project", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(["packages/my-lib/package.json"], {}, context)
    const target = nodes[0][1].projects["packages/my-lib"].targets.lint

    expect(target.options.projectRoot).toBe("packages/my-lib")
  })
})
