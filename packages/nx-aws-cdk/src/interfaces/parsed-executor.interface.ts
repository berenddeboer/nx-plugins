export interface ParsedExecutorInterface {
  stacks?: string[]
  context?: Record<string, string>
  otherArgs?: Record<string, string> // any other arguments which were passed
  sourceRoot: string
  root: string
}
