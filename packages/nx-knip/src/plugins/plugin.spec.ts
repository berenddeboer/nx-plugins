import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { CreateNodesContext } from "@nx/devkit"
import { createNodesV2 } from "./plugin"

describe("@berenddeboer/nx-knip/plugin", () => {
  const createNodesFunction = createNodesV2[1]
  let context: CreateNodesContext
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "nx-knip-test"))
    context = {
      nxJsonConfiguration: {},
      workspaceRoot: tempDir,
      configFiles: [],
    }
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  function createPackageJson(projectRoot: string) {
    const dir = join(tempDir, projectRoot)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: projectRoot }))
  }

  it("should infer knip target for a project", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(["packages/my-lib/package.json"], {}, context)
    const project = nodes[0][1].projects["packages/my-lib"]

    expect(project.targets).toHaveProperty("knip")
    expect(project.targets.knip.executor).toBe("@berenddeboer/nx-knip:knip")
  })

  it("should use custom target name", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(
      ["packages/my-lib/package.json"],
      { targetName: "lint-unused" },
      context
    )
    const project = nodes[0][1].projects["packages/my-lib"]

    expect(project.targets).toHaveProperty("lint-unused")
    expect(project.targets).not.toHaveProperty("knip")
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

  it("should not include strict in options by default", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(["packages/my-lib/package.json"], {}, context)
    const options = nodes[0][1].projects["packages/my-lib"].targets.knip.options

    expect(options).not.toHaveProperty("strict")
  })

  it("should pass strict option when set to true", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(
      ["packages/my-lib/package.json"],
      { strict: true },
      context
    )
    const options = nodes[0][1].projects["packages/my-lib"].targets.knip.options

    expect(options.strict).toBe(true)
  })

  it("should pass strict option when set to false", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(
      ["packages/my-lib/package.json"],
      { strict: false },
      context
    )
    const options = nodes[0][1].projects["packages/my-lib"].targets.knip.options

    expect(options.strict).toBe(false)
  })

  it("should pass env option when provided", async () => {
    createPackageJson("packages/my-lib")
    const nodes = await createNodesFunction(
      ["packages/my-lib/package.json"],
      { env: { DATABASE_URL: "postgres://localhost/dummy" } },
      context
    )
    const options = nodes[0][1].projects["packages/my-lib"].targets.knip.options

    expect(options.env).toEqual({ DATABASE_URL: "postgres://localhost/dummy" })
  })
})
