import {
  addProjectConfiguration,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  formatFiles,
  runTasksInSerial,
  Tree,
  writeJson,
} from "@nx/devkit"
import * as path from "path"
import { AppGeneratorSchema } from "./schema"
import { jestProjectGenerator } from "@nx/jest"
import initGenerator from "../init/init"
import { SSTRunExecutorSchema } from "../../executors/sst/schema"
import { join } from "path"

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

export async function addJest(host: Tree, options: NormalizedSchema) {
  if (options.unitTestRunner !== "jest") {
    return () => {
      /* do nothing */
    }
  }

  return await jestProjectGenerator(host, {
    project: options.projectName,
    supportTsx: true,
    skipSerializers: true,
    setupFile: "none",
    babelJest: true,
  })
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

export default async function (host: Tree, schema: AppGeneratorSchema) {
  const options = normalizeOptions(host, schema)

  const initTask = await initGenerator(host, options)

  const runTarget = (options: SSTRunExecutorSchema) => ({
    executor: "@berenddeboer/nx-sst:sst",
    options,
  })
  const nxLinter = (options: NXLintExecutorSchema) => ({
    executor: "@nx/linter:eslint",
    options,
  })
  addProjectConfiguration(host, options.projectName, {
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
      "sst-test": runTarget({ command: "test" }),
      cdk: runTarget({ command: "cdk" }),
      "add-cdk": runTarget({ command: "add-cdk" }),
      lint: {
        ...nxLinter({ lintFilePatterns: [`${options.projectRoot}/**/*.ts`] }),
        outputs: ["{options.outputFile}"],
      },
    },
    tags: options.parsedTags,
  })
  addFiles(host, options)
  const jestTask = await addJest(host, options)

  await formatFiles(host)
  return runTasksInSerial(initTask, jestTask)
}
