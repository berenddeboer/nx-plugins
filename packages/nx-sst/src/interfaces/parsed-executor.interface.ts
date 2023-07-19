export interface ParsedExecutorInterface {
  parseArgs?: Record<string, string> // list of sst optional arguments
  stacks?: string[]
  polyfills?: string[] // optional list of requires
}
