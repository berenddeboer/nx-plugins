import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  Tree,
  updateJson,
} from "@nx/devkit"
import { jestInitGenerator } from "@nx/jest"
import { InitSchema } from "./schema"

function updateDependencies(tree: Tree) {
  updateJson(tree, "package.json", (json) => {
    if (json.dependencies && json.dependencies["nx-sst"]) {
      delete json.dependencies["nx-sst"]
    }
    return json
  })
  return addDependenciesToPackageJson(
    tree,
    {
      sst: "^2.3.0",
      constructs: "10.1.156",
    },
    {
      "@types/aws-lambda": "^8.10.70",
    }
  )
}

export default async function (tree: Tree, schema: InitSchema) {
  let jestInstall: GeneratorCallback
  const tasks: GeneratorCallback[] = []
  if (!schema.unitTestRunner || schema.unitTestRunner === "jest") {
    jestInstall = await jestInitGenerator(tree, {})
  }
  const installTask = updateDependencies(tree)
  tasks.push(installTask)

  await formatFiles(tree)

  return async () => {
    if (jestInstall) {
      await jestInstall()
    }
    await installTask()
  }
}
