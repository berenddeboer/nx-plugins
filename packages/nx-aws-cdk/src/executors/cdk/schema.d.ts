export interface CdkExecutorSchema {
  command: string
  stacks?: string[]
  context?: Record<string, string>
}
