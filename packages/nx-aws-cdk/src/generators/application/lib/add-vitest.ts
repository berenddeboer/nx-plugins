import { ensurePackage, Tree } from "@nx/devkit"
import { NormalizedOptions } from "../schema"
import { nxVersion } from "../../../utils/versions"

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
