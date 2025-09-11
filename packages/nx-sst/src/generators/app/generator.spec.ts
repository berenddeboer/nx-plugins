import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing"
import { Tree, readProjectConfiguration } from "@nx/devkit"

import generator from "./generator"
import { AppGeneratorSchema } from "./schema"

describe("sst generator", () => {
  let appTree: Tree
  const options: AppGeneratorSchema = {
    name: "test",
    stage: "dev",
    region: "us-east-1",
    skipFormat: true,
    linter: "eslint",
  }

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace()
  })

  it("should run successfully", async () => {
    await generator(appTree, options)
    const config = readProjectConfiguration(appTree, "test")
    expect(config).toBeDefined()
    expect(config.targets.lint).toBeDefined()
    expect(config.targets.lint.options.lintFilePatterns).toBeDefined()
    expect(config.targets.test).toBeUndefined()
  })

  it("supports the jest test runner", async () => {
    await generator(appTree, { ...options, unitTestRunner: "jest" })
    const config = readProjectConfiguration(appTree, "test")
    expect(config).toBeDefined()
    expect(config.targets.lint).toBeDefined()
    expect(config.targets.lint.options.lintFilePatterns).toBeDefined()
    expect(config.targets.test.executor).toBe("@nx/jest:jest")
  })

  it("supports the vitest test runner", async () => {
    await generator(appTree, { ...options, unitTestRunner: "vitest" })
    const config = readProjectConfiguration(appTree, "test")
    expect(config).toBeDefined()
    expect(config.targets.lint).toBeDefined()
    expect(config.targets.lint.executor).toBe("@nx/eslint:lint")
    expect(config.targets.lint.options.lintFilePatterns).toBeDefined()
    expect(config.targets.test.executor).toBe("@nx/vite:test")
  })

  it("supports disabling the linter", async () => {
    await generator(appTree, { ...options, linter: "none" })
    const config = readProjectConfiguration(appTree, "test")
    expect(config).toBeDefined()
    expect(config.targets.lint).toBeUndefined()
  })
})
