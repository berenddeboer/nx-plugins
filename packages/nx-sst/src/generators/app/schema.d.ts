// nx-ignore-next-line
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Linter } = require("@nx/linter") // use require to import to avoid circular dependency
import { InitSchema } from "../init/schema"

export interface AppGeneratorSchema extends InitSchema {
  name: string
  stage?: string
  region?: string
  tags?: string
  directory?: string
  linter?: Linter
  setParserOptionsProject?: boolean
}
