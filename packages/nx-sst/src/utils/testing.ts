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
              executor: `@berenddeboer/nx-sst:${executorName}`,
            },
          },
        },
      },
    },
    target: {
      executor: `@berenddeboer/nx-sst:${executorName}`,
    },
    isVerbose: true,
  }
}
