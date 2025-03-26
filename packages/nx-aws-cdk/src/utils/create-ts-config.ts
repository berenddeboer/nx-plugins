import { Tree, writeJson } from "@nx/devkit"
import * as shared from "@nx/js/src/utils/typescript/create-ts-config"

// Define interface for TypeScript configuration
interface TsConfig {
  files?: string[]
  references?: Array<{ path: string }>
  compileOnSave?: boolean
  compilerOptions?: Record<string, unknown>
  exclude?: string[]
  extends?: string
  include?: string[]
}

export function createTsConfig(
  host: Tree,
  options: {
    projectRoot: string
    rootProject?: boolean
    unitTestRunner?: string
    isUsingTsSolutionConfig: boolean
  },
  relativePathToRootTsConfig: string
) {
  createAppTsConfig(host, options)
  const json: TsConfig = {
    files: [],
    references: [
      {
        path: "./tsconfig.app.json",
      },
    ],
  }

  if (options.unitTestRunner !== "none") {
    json.references?.push({
      path: "./tsconfig.spec.json",
    })
  }

  // inline tsconfig.base.json into the project
  if (options.rootProject) {
    json.compileOnSave = false
    json.compilerOptions = {
      ...shared.tsConfigBaseOptions,
      ...json.compilerOptions,
    }
    json.exclude = ["node_modules", "tmp", "cdk.out"]
  } else {
    json.extends = relativePathToRootTsConfig
  }

  writeJson(host, `${options.projectRoot}/tsconfig.json`, json)
}

function createAppTsConfig(host: Tree, options: { projectRoot: string }) {
  const json: TsConfig = {
    extends: "./tsconfig.json",
    compilerOptions: {
      composite: true,
    },
    include: ["src/**/*"],
    exclude: [],
  }

  writeJson(host, `${options.projectRoot}/tsconfig.app.json`, json)
}
