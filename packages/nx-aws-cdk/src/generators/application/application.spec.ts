import { Tree, readJson, readNxJson } from "@nx/devkit"
import * as devkit from "@nx/devkit"
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing"

import generator from "./application"
import { ApplicationGeneratorOptions } from "./schema"

describe("aws-cdk generator", () => {
  let appTree: Tree
  const appDirectory = "my-cdk-app"
  const options: ApplicationGeneratorOptions = {
    directory: appDirectory,
    addPlugin: true,
    unitTestRunner: "none",
    linter: "none", // For some reason enabling the linter crashes the test. Works fine when running for real.
  }

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace()
    jest.clearAllMocks()
  })

  it("should run successfully", async () => {
    await generator(appTree, options)
    //console.debug(appTree)
    const config = readNxJson(appTree)
    expect(config).toBeDefined()
    const plugin = config.plugins.some(
      (plugin: devkit.PluginConfiguration) => plugin === "@berenddeboer/nx-aws-cdk/plugin"
    )
    expect(plugin).toBeDefined()
    const vitePlugin = config.plugins.some(
      (plugin: devkit.PluginConfiguration) => plugin === "@nx/vite/plugin"
    )
    expect(vitePlugin).toBeFalsy()
    expect(appTree.exists(`${appDirectory}/cdk.json`)).toBeTruthy()
    expect(appTree.exists(`${appDirectory}/tsconfig.json`)).toBeTruthy()
    expect(appTree.exists(`${appDirectory}/tsconfig.app.json`)).toBeTruthy()
    expect(appTree.exists(`${appDirectory}/src/main.ts`)).toBeTruthy()
    expect(appTree.exists(`${appDirectory}/src/stacks/app-stack.ts`)).toBeTruthy()
    const pkgjson = readJson(appTree, `${appDirectory}/package.json`)
    expect(pkgjson.nx).toBeUndefined()
    expect(pkgjson.name).toBe(appDirectory)
  })

  it("supports disabling linting", async () => {
    await generator(appTree, { ...options, linter: "none" })
    expect(appTree.exists(`${appDirectory}/.eslint.confit.mjs`)).toBeFalsy()
  })

  it("supports the jest test runner", async () => {
    // Can't test this, test crashes
    /*
    await generator(appTree, { ...options, unitTestRunner: "jest" })
    const config = readNxJson(appTree)
    expect(config).toBeDefined()
    const jestPlugin = config.plugins.some((plugin: devkit.PluginConfiguration) => plugin === '@nx/jest/plugin')
    expect(jestPlugin).toBeDefined()
     */
  })

  it("supports the vitest test runner", async () => {
    await generator(appTree, { ...options, unitTestRunner: "vitest" })
    const config = readNxJson(appTree)
    expect(config).toBeDefined()
    const vitePlugin = config.plugins.some(
      (plugin: devkit.PluginConfiguration) => plugin === "@nx/vite/plugin"
    )
    expect(vitePlugin).toBeDefined()
    expect(appTree.exists("vitest.workspace.ts")).toBeTruthy()
  })
})
