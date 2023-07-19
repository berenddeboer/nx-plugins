import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  Tree,
  updateJson,
} from "@nx/devkit"
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
      sst: "^2.16.3",
      constructs: "10.1.156",
    },
    {
      "@types/aws-lambda": "^8.10.70",
    }
  )
}

export default async function (tree: Tree, schema: InitSchema) {
  const tasks: GeneratorCallback[] = []
  const installTask = updateDependencies(tree)
  tasks.push(installTask)

  if (!schema.skipFormat) {
    await formatFiles(tree)
  }

  return async () => {
    for (const task of tasks) {
      await task()
    }
  }
}
