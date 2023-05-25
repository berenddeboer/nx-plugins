export interface SSTRunExecutorSchema {
  command: string
  parameters?: string[]
  stage?: string
  region?: string
  roleArn?: string
  noColor?: boolean
  verbose?: boolean
}
