import { type Tree, ensurePackage } from "@nx/devkit"
import { nxVersion } from "../../../utils/versions"
import type { NormalizedOptions } from "../schema"

export async function addVitest(tree: Tree, options: NormalizedOptions) {
  const { vitestGenerator } = ensurePackage<typeof import("@nx/vite")>(
    "@nx/vite",
    nxVersion
  )

  const vitestTask = await vitestGenerator(tree, {
    project: options.appProjectName,
    uiFramework: "none",
    coverageProvider: "v8",
    skipFormat: true,
    testEnvironment: "jsdom",
    skipViteConfig: true,
    addPlugin: true,
  })

  return vitestTask
}
