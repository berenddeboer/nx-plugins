import type { GeneratorCallback, Tree } from "@nx/devkit"
import { addDependenciesToPackageJson } from "@nx/devkit"
import { CDK_CLI_VERSION, CDK_VERSION, CONSTRUCTS_VERSION } from "./versions"

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
