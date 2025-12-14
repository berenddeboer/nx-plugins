import { type CreateNodesV2, createNodesFromFiles } from "@nx/devkit"

export const name = "nx-biome-plugin"

// Match all project.json files to infer lint target for each project
const projectConfigGlob = "**/project.json"

export interface BiomePluginOptions {
  targetName?: string
}

export const createNodesV2: CreateNodesV2<BiomePluginOptions> = [
  projectConfigGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, _context) => {
        const projectRoot = configFile.replace("/project.json", "") || "."
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
