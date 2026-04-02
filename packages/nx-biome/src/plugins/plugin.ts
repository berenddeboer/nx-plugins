import { dirname } from "node:path"
import { type CreateNodesV2, createNodesFromFiles } from "@nx/devkit"

export const name = "nx-biome-plugin"

// Match both project.json and package.json to infer lint target for each project
const projectConfigGlob = "**/{project,package}.json"

export interface BiomePluginOptions {
  targetName?: string
}

export const createNodesV2: CreateNodesV2<BiomePluginOptions> = [
  projectConfigGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, _context) => {
        // Skip node_modules
        if (configFile.includes("node_modules")) {
          return {}
        }

        let projectRoot: string
        if (configFile.endsWith("/project.json")) {
          projectRoot = configFile.replace("/project.json", "") || "."
        } else {
          // package.json
          projectRoot = dirname(configFile)
          // Skip root package.json
          if (projectRoot === ".") {
            return {}
          }
        }

        const targetName = options?.targetName ?? "lint"

        return {
          projects: {
            [projectRoot]: {
              targets: {
                [targetName]: {
                  cache: true,
                  inputs: [
                    "{projectRoot}/biome.json",
                    "{projectRoot}/biome.jsonc",
                    "{projectRoot}/**/*.ts",
                    "{projectRoot}/**/*.tsx",
                    "{projectRoot}/**/*.cjs",
                    "{projectRoot}/**/*.js",
                    "{projectRoot}/**/*.jsx",
                    "{projectRoot}/**/*.mjs",
                    "{projectRoot}/**/*.json",
                    "{projectRoot}/**/*.jsonc",
                    "{projectRoot}/**/*.yaml",
                    "{projectRoot}/**/*.yml",
                    "{projectRoot}/**/*.css",
                    "{projectRoot}/**/*.scss",
                    "{projectRoot}/**/*.less",
                    "{projectRoot}/**/*.sass",
                    "{projectRoot}/**/*.html",
                    "{projectRoot}/**/*.graphql",
                    "{projectRoot}/**/*.gql",
                    "{projectRoot}/**/*.md",
                    "{workspaceRoot}/biome.json",
                    "{workspaceRoot}/biome.jsonc",
                  ],
                  outputs: [],
                  executor: "@berenddeboer/nx-biome:biome",
                  options: {
                    projectRoot,
                  },
                  metadata: {
                    technologies: ["biome"],
                    description: "Runs Biome linter and formatter check",
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
