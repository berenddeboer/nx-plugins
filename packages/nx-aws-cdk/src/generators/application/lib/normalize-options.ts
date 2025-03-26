import { Tree, readNxJson } from "@nx/devkit"
import {
  determineProjectNameAndRootOptions,
  ensureRootProjectName,
} from "@nx/devkit/src/generators/project-name-and-root-utils"
import { Linter } from "@nx/eslint"
import { isUsingTsSolutionSetup } from "@nx/js/src/utils/typescript/ts-solution-setup"
import type { ApplicationGeneratorOptions, NormalizedOptions } from "../schema"

export async function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorOptions
): Promise<NormalizedOptions> {
  await ensureRootProjectName(options, "application")
  const { projectName: appProjectName, projectRoot: appProjectRoot } =
    await determineProjectNameAndRootOptions(tree, {
      name: options.name,
      projectType: "application",
      directory: options.directory,
      rootProject: options.rootProject,
    })
  options.rootProject = appProjectRoot === "."

  const nxJson = readNxJson(tree)
  const addPlugin =
    process.env.NX_ADD_PLUGINS !== "false" && nxJson.useInferencePlugins !== false

  return {
    addPlugin,
    ...options,
    strict: options.strict ?? false,
    appProjectName,
    appProjectRoot,
    linter: options.linter ?? Linter.EsLint,
    unitTestRunner: options.unitTestRunner ?? "jest",
    //unitTestRunner: "none",
    useProjectJson: options.useProjectJson ?? !isUsingTsSolutionSetup(tree),
    useTsSolution: true,
  }
}
