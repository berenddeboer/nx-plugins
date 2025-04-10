import { Tree } from "@nx/devkit"

export function updateGitIgnore(tree: Tree) {
  const contents = tree.read(".gitignore", "utf-8") ?? ""

  const nuxtEntries = ["# CDK asset staging directory", ".cdk.staging", "cdk.out"]

  let newContents = contents

  for (const entry of nuxtEntries) {
    const regex = new RegExp(`^${entry}$`, "m")
    if (!regex.test(newContents)) {
      newContents += `\n${entry}`
    }
  }

  tree.write(".gitignore", [newContents].join("\n"))
}
