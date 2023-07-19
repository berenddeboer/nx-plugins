export interface ParsedExecutorInterface {
  root: string // workspace root
  parseArgs?: Record<string, string> // list of sst optional arguments
  stacks?: string[]
  polyfills?: string[] // optional list of requires
}
