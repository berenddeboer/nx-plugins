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
      // What CDK generates by default. Not sure this is what we want in nx.
      target: "ES2020",
      module: "commonjs",
      moduleResolution: "node",
      lib: ["es2020", "dom"],
      declaration: true,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      noImplicitThis: true,
      alwaysStrict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: false,
      inlineSourceMap: true,
      inlineSources: true,
      experimentalDecorators: true,
      strictPropertyInitialization: false,
      typeRoots: ["./node_modules/@types"],
      types: ["node"],
    },
    include: ["src/**/*"],
    exclude: [],
  }

  writeJson(host, `${options.projectRoot}/tsconfig.app.json`, json)
}
