import type { Tree } from "@nx/devkit"
import { offsetFromRoot } from "@nx/devkit"
import { generateFiles, joinPathFragments } from "@nx/devkit"
import type { NormalizedOptions } from "../schema"

export function createFiles(tree: Tree, options: NormalizedOptions): void {
  const projectOffsetFromRoot = offsetFromRoot(options.appProjectRoot)
  generateFiles(
    tree,
    joinPathFragments(__dirname, "..", "files"),
    joinPathFragments(options.appProjectRoot),
    {
      template: "",
      name: options.appProjectName,
      root: options.appProjectRoot,
      projectName: options.appProjectName,
      offsetFromRoot: projectOffsetFromRoot,
    }
  )
}
