import { CreateNodesContext } from "@nx/devkit"
import { createNodesV2 } from "./plugin"
import { TempFs } from "../utils/temp-fs"

describe("@berenddeboer/nx-aws-cdk/plugin", () => {
  const createNodesFunction = createNodesV2[1]
  let context: CreateNodesContext

  describe("root project", () => {
    const tempFs = new TempFs("test")
    const projectRoot = "stacks/cdk-app"

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
        workspaceRoot: tempFs.tempDir,
        configFiles: [],
      }

      tempFs.createFileSync(
        `${projectRoot}/package.json`,
        JSON.stringify({ name: "cdk-app" })
      )
    })

    afterEach(() => {
      jest.resetModules()
      tempFs.cleanup()
    })

    it("should create all targets when names are provided", async () => {
      const options = {
        cdkTargetName: "cdk",
        synthTargetName: "synth",
        deployTargetName: "deploy",
        diffTargetName: "diff",
        rollbackTargetName: "rollback",
        watchTargetName: "watch",
        destroyTargetName: "destroy",
      }
      const nodes = await createNodesFunction(
        [`${projectRoot}/cdk.json`],
        options,
        context
      )
      const project = nodes[0][1].projects[projectRoot]

      expect(project.targets).toHaveProperty("cdk")
      expect(project.targets).toHaveProperty("synth")
      expect(project.targets).toHaveProperty("deploy")
      expect(project.targets).toHaveProperty("diff")
      expect(project.targets).toHaveProperty("rollback")
      expect(project.targets).toHaveProperty("watch")
      expect(project.targets).toHaveProperty("destroy")
    })

    it("should not create targets when names are null", async () => {
      const options = {
        synthTargetName: null,
        deployTargetName: null,
        diffTargetName: null,
        rollbackTargetName: null,
        watchTargetName: null,
        destroyTargetName: null,
      }
      const nodes = await createNodesFunction(
        [`${projectRoot}/cdk.json`],
        options,
        context
      )
      const project = nodes[0][1].projects[projectRoot]

      expect(project.targets).toEqual({})
    })

    it("should not create targets when names are empty strings", async () => {
      const options = {
        synthTargetName: "",
        deployTargetName: "",
        diffTargetName: "",
        rollbackTargetName: "",
        watchTargetName: "",
        destroyTargetName: "",
      }
      const nodes = await createNodesFunction(
        [`${projectRoot}/cdk.json`],
        options,
        context
      )
      const project = nodes[0][1].projects[projectRoot]

      expect(project.targets).toEqual({})
    })

    it("should not create targets when names are not specified", async () => {
      const nodes = await createNodesFunction([`${projectRoot}/cdk.json`], {}, context)
      const project = nodes[0][1].projects[projectRoot]

      expect(project.targets).toEqual({})
    })

    it("should create only specified targets", async () => {
      const options = {
        synthTargetName: "synth",
        deployTargetName: "deploy",
        // other targets not specified
      }
      const nodes = await createNodesFunction(
        [`${projectRoot}/cdk.json`],
        options,
        context
      )
      const project = nodes[0][1].projects[projectRoot]

      expect(project.targets).toHaveProperty("synth")
      expect(project.targets).toHaveProperty("deploy")
      expect(project.targets).not.toHaveProperty("diff")
      expect(project.targets).not.toHaveProperty("rollback")
      expect(project.targets).not.toHaveProperty("watch")
      expect(project.targets).not.toHaveProperty("destroy")
    })
  })
})
