import { Tree } from "nx/src/generators/tree"
import { Linter, LinterType, lintProjectGenerator } from "@nx/eslint"
import { joinPathFragments } from "nx/src/utils/path"
import { GeneratorCallback, runTasksInSerial } from "@nx/devkit"

// TODO(colum): Look into the recommended set up using `withNuxt` inside eslint.config.mjs. https://eslint.nuxt.com/packages/config
export async function addLinting(
  host: Tree,
  options: {
    linter: Linter | LinterType
    projectName: string
    projectRoot: string
    unitTestRunner?: "jest" | "vitest" | "none"
    rootProject?: boolean
  }
) {
  const tasks: GeneratorCallback[] = []
  if (options.linter === "eslint") {
    const lintTask = await lintProjectGenerator(host, {
      linter: options.linter,
      project: options.projectName,
      tsConfigPaths: [joinPathFragments(options.projectRoot, "tsconfig.json")],
      unitTestRunner: options.unitTestRunner,
      skipFormat: true,
      rootProject: options.rootProject,
      addPlugin: true,
    })
    tasks.push(lintTask)
  }
  return runTasksInSerial(...tasks)
}
