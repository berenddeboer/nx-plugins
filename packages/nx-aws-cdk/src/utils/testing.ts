import { ExecutorContext } from "@nx/devkit"

export function mockExecutorContext(
  executorName: string,
  workspaceVersion = 2
): ExecutorContext {
  return {
    projectName: "proj",
    root: "/root",
    cwd: "/root",
    workspace: {
      version: workspaceVersion,
      projects: {
        proj: {
          root: "apps/proj",
          targets: {
            test: {
              executor: `@berenddeboer/nx-aws-cdk:${executorName}`,
            },
          },
        },
      },
    },
    target: {
      executor: `@berenddeboer/nx-aws-cdk:${executorName}`,
    },
    isVerbose: true,
  }
}
