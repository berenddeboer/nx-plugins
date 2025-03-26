import {
  CreateNodesContextV2,
  CreateNodesV2,
  TargetConfiguration,
  createNodesFromFiles,
} from "@nx/devkit"
import { readdirSync, existsSync } from "fs"
import { dirname, join } from "path"

// Expected format of the plugin options defined in nx.json
export interface CdkPluginOptions {
  synthTargetName?: string
  deployTargetName?: string
  diffTargetName?: string
  rollbackTargetName?: string
  watchTargetName?: string
  destroyTargetName?: string
}

// File glob to find all the configuration files for this plugin
const cdkConfigGlob = "**/cdk.json"

// Entry function that Nx calls to modify the graph
export const createNodesV2: CreateNodesV2<CdkPluginOptions> = [
  cdkConfigGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) => createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context
    )
  },
]

async function createNodesInternal(
  configFilePath: string,
  options: CdkPluginOptions,
  context: CreateNodesContextV2
) {
  const projectRoot = dirname(configFilePath)
  const fullPath = join(context.workspaceRoot, projectRoot)

  // Bail early if directory doesn't exist
  if (!existsSync(fullPath)) {
    return {}
  }

  // Do not create a project if package.json or project.json isn't there.
  const siblingFiles = readdirSync(fullPath)
  if (!siblingFiles.includes("package.json") && !siblingFiles.includes("project.json")) {
    return {}
  }

  // Inferred task final output
  const synthTarget: TargetConfiguration = {
    command: `npx cdk synth`,
    options: { cwd: projectRoot },
    cache: true,
    inputs: [
      "default",
      {
        externalDependencies: ["aws-cdk"],
      },
    ],
    outputs: [`{projectRoot}/dist/${projectRoot}`],
  }
  const deployTarget: TargetConfiguration = {
    command: `npx cdk deploy`,
    options: { cwd: projectRoot },
    inputs: [
      "default",
      {
        externalDependencies: ["aws-cdk"],
      },
    ],
    outputs: [`{projectRoot}/dist/${projectRoot}`],
  }
  const diffTarget: TargetConfiguration = {
    ...deployTarget,
    command: `npx cdk diff`,
  }
  const rollbackTarget: TargetConfiguration = {
    ...deployTarget,
    command: `npx cdk rollback`,
  }
  const watchTarget: TargetConfiguration = {
    ...deployTarget,
    command: `npx cdk watch`,
  }
  const destroyTarget: TargetConfiguration = {
    ...deployTarget,
    command: `npx cdk destroy`,
  }

  // Project configuration to be merged into the rest of the Nx configuration
  return {
    projects: {
      [projectRoot]: {
        targets: {
          [options.synthTargetName]: synthTarget,
          [options.deployTargetName]: deployTarget,
          [options.diffTargetName]: diffTarget,
          [options.rollbackTargetName]: rollbackTarget,
          [options.watchTargetName]: watchTarget,
          [options.destroyTargetName]: destroyTarget,
        },
      },
    },
  }
}
