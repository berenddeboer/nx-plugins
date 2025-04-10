import {
  addProjectConfiguration,
  ensurePackage,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  formatFiles,
  runTasksInSerial,
  Tree,
  writeJson,
} from "@nx/devkit"
import { nxVersion } from "../../utils/versions"
import * as path from "path"
import { AppGeneratorSchema } from "./schema"
import initGenerator from "../init/init"
import { SSTRunExecutorSchema } from "../../executors/sst/schema"
import { join } from "path"
import { Linter, lintProjectGenerator } from "@nx/linter"

interface NormalizedSchema extends AppGeneratorSchema {
  projectName: string
  projectRoot: string
  projectDirectory: string
  parsedTags: string[]
}

function normalizeOptions(host: Tree, options: AppGeneratorSchema): NormalizedSchema {
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
  }
}

function addFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: "",
    dot: ".",
  }
  const packageJsonPath = join(options.projectRoot, "package.json")
  writeJson(host, packageJsonPath, {
    name: options.name,
    scripts: {
      sst: "sst",
    },
  })
  generateFiles(host, path.join(__dirname, "files"), options.projectRoot, templateOptions)
}

export interface NXLintExecutorSchema {
  lintFilePatterns: string[]
}

export default async function (tree: Tree, schema: AppGeneratorSchema) {
  const tasks: GeneratorCallback[] = []
  tasks.push(
    await initGenerator(tree, {
      ...schema,
      skipFormat: true,
    })
  )

  const options = normalizeOptions(tree, schema)

  const runTarget = (options: SSTRunExecutorSchema) => ({
    executor: "@berenddeboer/nx-sst:sst",
    options,
  })

  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    projectType: "application",
    targets: {
      dev: runTarget({ command: "dev" }),
      diff: runTarget({ command: "diff" }),
      build: {
        ...runTarget({ command: "build" }),
        outputs: [`${options.projectRoot}/.sst`],
      },
      deploy: runTarget({ command: "deploy" }),
      remove: runTarget({ command: "remove" }),
    },
    tags: options.parsedTags,
  })
  addFiles(tree, options)

  if (options.linter !== Linter.None) {
    const lintCallback = await addLint(tree, options)
    tasks.push(lintCallback)
  }

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
