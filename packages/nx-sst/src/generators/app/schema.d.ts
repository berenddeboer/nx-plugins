import { InitSchema } from "../init/schema"

export interface AppGeneratorSchema extends InitSchema {
  name: string
  stage?: string
  region?: string
  tags?: string
  directory?: string
}
