import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  Tree,
} from "@nx/devkit"

import { InitGeneratorSchema } from "./schema"
import {
  CDK_ESLINT_VERSION,
  CDK_VERSION,
  CONSTRUCTS_VERSION,
} from "../../utils/cdk-shared"

export async function initGenerator(tree: Tree, schema: InitGeneratorSchema) {
  const installTask = addDependenciesToPackageJson(
    tree,
    {
      "aws-cdk-lib": CDK_VERSION,
      constructs: CONSTRUCTS_VERSION,
    },
    {
      "aws-cdk": CDK_VERSION,
      "eslint-plugin-cdk": CDK_ESLINT_VERSION,
    }
  )

  if (!schema.skipFormat) {
    await formatFiles(tree)
  }

  return async () => {
    await installTask()
  }
}

export default initGenerator
export const initSchematic = convertNxGenerator(initGenerator)
