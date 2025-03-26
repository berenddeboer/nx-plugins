import { ExecutorContext } from "@nx/devkit"

// We run a very complex cdk
const NX_WORKSPACE_ROOT = process.env.NX_WORKSPACE_ROOT ?? ""
export const cdk = `node --require ts-node/register ${NX_WORKSPACE_ROOT}/node_modules/aws-cdk/bin/cdk.js -a "pnpm dlx ts-node --require tsconfig-paths/register --project ${NX_WORKSPACE_ROOT}/packages/nx-aws-cdk/test/apps/proj/tsconfig.app.json ${NX_WORKSPACE_ROOT}/packages/nx-aws-cdk/test/apps/proj/bin/cdk-stack.ts"`

export function mockExecutorContext(
  executorName: string,
  workspaceVersion = 2
): ExecutorContext {
  const context: ExecutorContext = {
    root: "/root",
    cwd: "/root",
    isVerbose: false,
    projectName: "proj",
    nxJsonConfiguration: {},
    projectsConfigurations: {
      version: workspaceVersion,
      projects: {
        proj: {
          root: "packages/nx-aws-cdk/test/apps/proj",
          targets: {
            test: {
              executor: `@berenddeboer/nx-aws-cdk:${executorName}`,
            },
          },
        },
      },
    },
    projectGraph: {
      nodes: {
        myapp: {
          type: "app",
          name: "proj",
          data: {
            root: "packages/nx-aws-cdk/test/apps/proj",
          },
        },
      },
      dependencies: {},
    },
    target: {
      executor: `@berenddeboer/nx-aws-cdk:${executorName}`,
    },
  }
  return context
}
