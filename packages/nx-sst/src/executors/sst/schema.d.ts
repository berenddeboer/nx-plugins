import { ParsedExecutorInterface } from "../../interfaces/parsed-executor.interface"

export interface SSTRunExecutorSchema extends ParsedExecutorInterface {
  command: string
  //parameters?: string[]
  stage?: string
  region?: string
  roleArn?: string
  noColor?: boolean
  verbose?: boolean
}
