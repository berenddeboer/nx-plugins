import {
  formatFiles,
  GeneratorCallback,
  joinPathFragments,
  runTasksInSerial,
  Tree,
  writeJson,
} from "@nx/devkit"
import { getRelativePathToRootTsConfig, initGenerator as jsInitGenerator } from "@nx/js"
import {
  addProjectToTsSolutionWorkspace,
  updateTsconfigFiles,
} from "@nx/js/src/utils/typescript/ts-solution-setup"
import { updateGitIgnore } from "../../utils/update-gitignore"
import { Linter } from "@nx/eslint"
import { addLinting } from "../../utils/add-linting"
import { addVitest } from "./lib/add-vitest"
import { addJest } from "./lib/add-jest"

import { ApplicationGeneratorOptions } from "./schema"
import { initGenerator } from "../init/init"
import { createFiles, normalizeOptions } from "./lib"
import { ensureDependencies } from "../../utils/ensure-dependencies"
import { createTsConfig } from "../../utils/create-ts-config"
import type { PackageJson } from "nx/src/utils/package-json"

export async function applicationGenerator(
  tree: Tree,
  rawOptions: ApplicationGeneratorOptions
): Promise<GeneratorCallback> {
  return await applicationGeneratorInternal(tree, rawOptions)
}

export async function applicationGeneratorInternal(
  tree: Tree,
  rawOptions: ApplicationGeneratorOptions
): Promise<GeneratorCallback> {
  const options = await normalizeOptions(tree, rawOptions)

  const tasks: GeneratorCallback[] = []
  const initTask = await initGenerator(tree, {
    skipPackageJson: options.skipPackageJson,
    skipFormat: true,
  })
  tasks.push(initTask)

  const jsInitTask = await jsInitGenerator(tree, {
    ...options,
    tsConfigName: options.rootProject ? "tsconfig.json" : "tsconfig.base.json",
    skipFormat: true,
    //addTsPlugin: options.useTsSolution,
    addTsPlugin: false, // this causes the app to crash
    platform: "node",
    addPlugin: true, // Disable plugin initialization to avoid e2e tsconfig lookup
  })
  tasks.push(jsInitTask)

  tasks.push(ensureDependencies(tree))

  const packageJson: PackageJson = {
    name: options.appProjectName,
    version: "0.0.1",
    private: true,
  }

  if (!options.useProjectJson || options.useTsSolution) {
    writeJson(
      tree,
      joinPathFragments(options.appProjectRoot, "package.json"),
      packageJson
    )
  }

  createFiles(tree, options)

  createTsConfig(
    tree,
    {
      projectRoot: options.appProjectRoot,
      rootProject: options.rootProject,
      unitTestRunner: options.unitTestRunner,
      isUsingTsSolutionConfig: options.useTsSolution,
    },
    getRelativePathToRootTsConfig(tree, options.appProjectRoot)
  )

  updateGitIgnore(tree)

  // If we are using the new TS solution
  // We need to update the workspace file (package.json or pnpm-workspaces.yaml) to include the new project
  if (options.useTsSolution) {
    await addProjectToTsSolutionWorkspace(tree, options.appProjectRoot)
  }

  tasks.push(
    await addLinting(tree, {
      projectName: options.appProjectName,
      projectRoot: options.appProjectRoot,
      linter: options.linter ?? Linter.EsLint,
      unitTestRunner: options.unitTestRunner,
      rootProject: options.rootProject,
    })
  )

  if (options.unitTestRunner === "jest") {
    tasks.push(await addJest(tree, options))
  }

  if (options.unitTestRunner === "vitest") {
    tasks.push(await addVitest(tree, options))
  }

  if (options.useTsSolution) {
    updateTsconfigFiles(
      tree,
      options.appProjectRoot,
      "tsconfig.app.json",
      {
        target: "ES2020",
        module: "commonjs",
        lib: ["es2020", "dom"],
        declaration: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        noImplicitThis: true,
        alwaysStrict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: false,
        inlineSourceMap: true,
        inlineSources: true,
        experimentalDecorators: true,
        strictPropertyInitialization: false,
        types: ["node"],
        typeRoots: ["./node_modules/@types"],
      },
      options.linter === "eslint"
        ? ["eslint.config.js", "eslint.config.cjs", "eslint.config.mjs"]
        : ["node_modules", "cdk.out"]
    )
  }

  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return runTasksInSerial(...tasks)
}

export default applicationGenerator
