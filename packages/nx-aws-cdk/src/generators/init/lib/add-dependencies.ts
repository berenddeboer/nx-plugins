import type { GeneratorCallback, Tree } from "@nx/devkit"
import { addDependenciesToPackageJson } from "@nx/devkit"
import {
  CDK_CLI_VERSION,
  CDK_VERSION,
  CONSTRUCTS_VERSION,
  TS_NODE_VERSION,
} from "../../../utils/versions"
import { InitGeneratorOptions } from "../schema"

export function addDependencies(
  tree: Tree,
  options: InitGeneratorOptions
): GeneratorCallback {
  return addDependenciesToPackageJson(
    tree,
    {
      "aws-cdk-lib": CDK_VERSION,
      constructs: CONSTRUCTS_VERSION,
    },
    {
      "aws-cdk": CDK_CLI_VERSION,
      "ts-node": TS_NODE_VERSION,
      "@types/node": "22.7.9",
    },
    undefined,
    options.keepExistingVersions
  )
}
