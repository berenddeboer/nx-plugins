import { type GeneratorCallback, type Tree, ensurePackage } from "@nx/devkit"
import { nxVersion } from "../../../utils/versions"
import type { NormalizedOptions } from "../schema"

export async function addJest(
  host: Tree,
  options: NormalizedOptions
): Promise<GeneratorCallback> {
  if (options.unitTestRunner === "none") {
    return () => {}
  }

  const { configurationGenerator } = ensurePackage<typeof import("@nx/jest")>(
    "@nx/jest",
    nxVersion
  )

  return await configurationGenerator(host, {
    ...options,
    project: options.appProjectName,
    supportTsx: true,
    skipSerializers: true,
    setupFile: "none",
    //compiler: options.compiler,
    skipFormat: true,
    runtimeTsconfigFileName: "tsconfig.app.json",
  })
}
