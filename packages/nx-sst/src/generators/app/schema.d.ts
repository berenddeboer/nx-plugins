import type { Linter, LinterType } from "@nx/eslint"
import { InitSchema } from "../init/schema"

export interface AppGeneratorSchema extends InitSchema {
  name: string
  stage?: string
  region?: string
  tags?: string
  directory?: string
  linter?: Linter | LinterType
  setParserOptionsProject?: boolean
}
