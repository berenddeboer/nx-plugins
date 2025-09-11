import { ExecutorContext } from "@nx/devkit"

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
          root: "apps/proj",
          targets: {
            test: {
              executor: `@berenddeboer/nx-sst:${executorName}`,
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
            root: "apps/proj",
          },
        },
      },
      dependencies: {},
    },
    target: {
      executor: `@berenddeboer/nx-sst:${executorName}`,
    },
  }
  return context
}
