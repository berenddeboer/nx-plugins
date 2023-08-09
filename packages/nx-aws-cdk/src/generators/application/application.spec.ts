import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing"
import { Tree, readProjectConfiguration } from "@nx/devkit"

import generator from "./application"
import { ApplicationSchema } from "./schema"

describe("aws-cdk generator", () => {
  let appTree: Tree
  const options: ApplicationSchema = { name: "test" }

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace()
  })

  it("should run successfully", async () => {
    await generator(appTree, options)
    const config = readProjectConfiguration(appTree, "test")
    expect(config).toBeDefined()
    expect(config.targets.synth.executor).toBe("@berenddeboer/nx-aws-cdk:cdk")
  })

  it("supports the directory option", async () => {
    await generator(appTree, { ...options, directory: "sub", unitTestRunner: "none" })
    const config = readProjectConfiguration(appTree, "sub-test")
    expect(config).toBeDefined()
    expect(config.name).toBe("sub-test")
    expect(config.root).toBe("sub/test")
    expect(config.sourceRoot).toBe("./sub/test/src")
  })

  it("supports disabling linting", async () => {
    await generator(appTree, { ...options, linter: "none" })
    const config = readProjectConfiguration(appTree, "test")
    expect(config).toBeDefined()
    expect(config.targets.lint).toBeUndefined()
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
    expect(config.targets.lint.executor).toBe("@nx/linter:eslint")
    expect(config.targets.lint.options.lintFilePatterns).toBeDefined()
    expect(config.targets.test.executor).toBe("@nx/vite:test")
  })
})
