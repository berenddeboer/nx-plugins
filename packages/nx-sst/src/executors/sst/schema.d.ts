export interface SSTRunExecutorSchema {
  command: string
  parameters?: string[]
  stage?: string
  region?: string
  roleArn?: string
  verbose?: boolean
  polyfills?: string[]
}
