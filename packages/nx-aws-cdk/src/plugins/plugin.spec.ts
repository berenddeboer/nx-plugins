import { CreateNodesContext } from "@nx/devkit"
import { createNodesV2 } from "./plugin"

describe("@berenddeboer/nx-aws-cdk/plugin", () => {
  const createNodesFunction = createNodesV2[1]
  let context: CreateNodesContext

  describe("root project", () => {
    beforeEach(async () => {
      context = {
        nxJsonConfiguration: {
          // These defaults should be overridden by plugin
          targetDefaults: {
            build: {
              cache: false,
              inputs: ["foo", "^foo"],
            },
          },
          namedInputs: {
            default: ["{projectRoot}/**/*"],
            production: ["!{projectRoot}/**/*.spec.ts"],
          },
        },
        workspaceRoot: "",
        configFiles: [],
      }
    })

    afterEach(() => {
      jest.resetModules()
    })

    it("should create nodes", async () => {
      const nodes = await createNodesFunction(["cdk.json"], {}, context)

      expect(nodes).toMatchSnapshot()
    })
  })
})
