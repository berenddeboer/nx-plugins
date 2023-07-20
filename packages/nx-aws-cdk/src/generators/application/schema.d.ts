// nx-ignore-next-line
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Linter } = require("@nx/linter") // use require to import to avoid circular dependency
import { InitGeneratorSchema } from "../init/schema"

export interface ApplicationSchema extends InitGeneratorSchema {
  name: string
  tags?: string
  directory?: string
  linter?: Linter
  setParserOptionsProject?: boolean
}
