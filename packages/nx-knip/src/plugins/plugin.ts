import { dirname } from "node:path"
import { type CreateNodesV2, createNodesFromFiles } from "@nx/devkit"

export const name = "nx-knip-plugin"

// Match all package.json files to infer knip target for each project
const projectConfigGlob = "**/package.json"

export interface KnipPluginOptions {
  targetName?: string
}

export const createNodesV2: CreateNodesV2<KnipPluginOptions> = [
  projectConfigGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, pluginOptions) => {
        // Skip node_modules
        if (configFile.includes("node_modules")) {
          return {}
        }

        const projectRoot = dirname(configFile)

        // Skip root package.json - knip runs from root for specific workspaces
        if (projectRoot === ".") {
          return {}
        }

        const targetName = pluginOptions?.targetName ?? "knip"

        return {
          projects: {
            [projectRoot]: {
              targets: {
                [targetName]: {
                  cache: true,
                  inputs: [
                    "{projectRoot}/package.json",
                    "{projectRoot}/**/*.ts",
                    "{projectRoot}/**/*.tsx",
                    "{projectRoot}/**/*.js",
                    "{projectRoot}/**/*.jsx",
                    "{projectRoot}/**/*.mjs",
                    "{projectRoot}/**/*.cjs",
                    "{projectRoot}/tsconfig.json",
                    "{projectRoot}/tsconfig.*.json",
                    // All possible knip config locations (including package.json "knip" property)
                    "{workspaceRoot}/package.json",
                    "{workspaceRoot}/knip.json",
                    "{workspaceRoot}/knip.jsonc",
                    "{workspaceRoot}/.knip.json",
                    "{workspaceRoot}/.knip.jsonc",
                    "{workspaceRoot}/knip.ts",
                    "{workspaceRoot}/knip.js",
                    "{workspaceRoot}/knip.config.ts",
                    "{workspaceRoot}/knip.config.js",
                  ],
                  outputs: [],
                  executor: "@berenddeboer/nx-knip:knip",
                  options: {
                    projectRoot,
                  },
                  metadata: {
                    technologies: ["knip"],
                    description: "Finds unused dependencies, exports, and files",
                  },
                },
              },
            },
          },
        }
      },
      configFiles,
      options,
      context
    )
  },
]
