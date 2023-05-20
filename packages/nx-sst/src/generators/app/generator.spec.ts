import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing"
import { Tree, readProjectConfiguration } from "@nx/devkit"

import generator from "./generator"
import { AppGeneratorSchema } from "./schema"

describe("sst generator", () => {
  let appTree: Tree
  const options: AppGeneratorSchema = {
    name: "test",
    stage: "dev",
    region: "us-east-1",
  }

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace()
  })

  it("should run successfully", async () => {
    await generator(appTree, options)
    const config = readProjectConfiguration(appTree, "test")
    expect(config).toBeDefined()
  })
})
