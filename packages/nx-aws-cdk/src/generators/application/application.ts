import * as path from "path"
import {
  addProjectConfiguration,
  convertNxGenerator,
  ensurePackage,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateJson,
  writeJson,
} from "@nx/devkit"
import { nxVersion } from "../../utils/versions"
import { Linter, lintProjectGenerator } from "@nx/linter"

import { ApplicationSchema } from "./schema"
import { initGenerator } from "../init/init"
import { CdkExecutorSchema } from "../../executors/cdk/schema"

interface NormalizedSchema extends ApplicationSchema {
  projectName: string
  projectRoot: string
  projectDirectory: string
  parsedTags: string[]
}

function normalizeOptions(host: Tree, options: ApplicationSchema): NormalizedSchema {
  const name = names(options.name).fileName
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name
  const projectName = projectDirectory.replace(new RegExp("/", "g"), "-")
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${projectDirectory}`
  const parsedTags = options.tags ? options.tags.split(",").map((s) => s.trim()) : []

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    linter: options.linter ?? Linter.EsLint,
    unitTestRunner: options.unitTestRunner ?? "jest",
  }
}

function addFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.projectName),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: "",
  }
  generateFiles(host, path.join(__dirname, "files"), options.projectRoot, templateOptions)
}

function updateLintConfig(tree: Tree, options: NormalizedSchema) {
  updateJson(tree, `${options.projectRoot}/.eslintrc.json`, (json) => {
    json.plugins = json?.plugins || []
    const plugins: string[] = json.plugins

    const hasCdkPlugin = plugins.findIndex((row) => row === "cdk") >= 0
    if (!hasCdkPlugin) {
      plugins.push("cdk")
    }
    return json
  })
}

export async function applicationGenerator(tree: Tree, schema: ApplicationSchema) {
  const tasks: GeneratorCallback[] = []
  tasks.push(
    await initGenerator(tree, {
      ...schema,
      skipFormat: true,
    })
  )

  const options = normalizeOptions(tree, schema)

  const runTarget = (options: CdkExecutorSchema) => ({
    executor: "@berenddeboer/nx-aws-cdk:cdk",
    options,
  })

  const project: ProjectConfiguration = {
    root: options.projectRoot,
    projectType: "application",
    sourceRoot: `${options.projectRoot}/src`,
    targets: {
      synth: runTarget({ command: "synth" }),
      deploy: runTarget({ command: "deploy" }),
      diff: runTarget({ command: "diff" }),
      destroy: runTarget({ command: "destroy" }),
    },
    tags: options.parsedTags,
  }
  addProjectConfiguration(tree, options.projectName, project)
  addFiles(tree, options)

  if (options.unitTestRunner === "jest") {
    const { jestProjectGenerator } = ensurePackage("@nx/jest", nxVersion)
    const jestTask = await jestProjectGenerator(tree, {
      project: options.name,
      supportTsx: true,
      skipSerializers: true,
      setupFile: "none",
      babelJest: true,
    })
    tasks.push(jestTask)
  } else if (options.unitTestRunner === "vitest") {
    const { vitestGenerator } = ensurePackage("@nx/vite", nxVersion)
    const vitestTask = await vitestGenerator(tree, {
      project: options.name,
      uiFramework: "none",
      coverageProvider: "v8",
      skipFormat: true,
    })
    tasks.push(vitestTask)
  }

  if (options.linter !== Linter.None) {
    const lintCallback = await addLint(tree, options)
    //updateLintConfig(tree, options)
    tasks.push(lintCallback)
  }

  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return runTasksInSerial(...tasks)
}

export async function addLint(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  return lintProjectGenerator(tree, {
    project: options.projectName,
    linter: options.linter,
    skipFormat: true,
    tsConfigPaths: [joinPathFragments(options.projectRoot, "tsconfig.lib.json")],
    unitTestRunner: options.unitTestRunner,
    eslintFilePatterns: [`${options.projectRoot}/**/*.ts`],
    setParserOptionsProject: options.setParserOptionsProject,
  })
}

export default applicationGenerator
export const applicationSchematic = convertNxGenerator(applicationGenerator)
