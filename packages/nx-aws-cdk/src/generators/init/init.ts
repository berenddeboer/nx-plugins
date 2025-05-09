import type { GeneratorCallback, Tree } from "@nx/devkit"
import { addPlugin } from "@nx/devkit/src/utils/add-plugin"
import { createProjectGraphAsync, formatFiles } from "@nx/devkit"
import { CdkPluginOptions, createNodesV2 } from "../../plugins/plugin"

import { addDependencies } from "./lib"
import type { InitGeneratorOptions } from "./schema"

export async function initGenerator(
  tree: Tree,
  options: InitGeneratorOptions
): Promise<GeneratorCallback> {
  await addPlugin<CdkPluginOptions>(
    tree,
    await createProjectGraphAsync(),
    "@berenddeboer/nx-aws-cdk/plugin",
    createNodesV2,
    {
      cdkTargetName: ["cdk"],
      synthTargetName: ["synth"],
      deployTargetName: ["deploy"],
      diffTargetName: ["diff"],
      rollbackTargetName: ["rollback"],
      watchTargetName: ["watch"],
      destroyTargetName: ["destroy"],
    },
    false
  )

  let installPackagesTask: GeneratorCallback = () => {}
  if (!options.skipPackageJson) {
    installPackagesTask = addDependencies(tree, options)
  }

  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return installPackagesTask
}

export default initGenerator
