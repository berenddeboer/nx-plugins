import type { GeneratorCallback, Tree } from "@nx/devkit"
import { CDK_CLI_VERSION, CDK_VERSION, CONSTRUCTS_VERSION } from "./versions"
import { addDependenciesToPackageJson } from "@nx/devkit"

export function ensureDependencies(tree: Tree): GeneratorCallback {
  return addDependenciesToPackageJson(
    tree,
    {
      "aws-cdk-lib": CDK_VERSION,
      constructs: CONSTRUCTS_VERSION,
    },
    {
      "aws-cdk": CDK_CLI_VERSION,
    }
  )
}
