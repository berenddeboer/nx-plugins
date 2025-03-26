import type { Linter, LinterType } from "@nx/eslint"

export interface ApplicationGeneratorOptions {
  directory: string
  name?: string
  linter?: Linter | LinterType
  skipFormat?: boolean
  skipPackageJson?: boolean
  tags?: string
  unitTestRunner?: "jest" | "vitest" | "none"
  setParserOptionsProject?: boolean
  rootProject?: boolean
  strict?: boolean
  addPlugin?: boolean
  useTsSolution?: boolean
  useProjectJson?: boolean
}

interface NormalizedOptions extends ApplicationGeneratorOptions {
  appProjectName: string
  appProjectRoot: Path
}
