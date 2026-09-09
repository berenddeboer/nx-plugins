export interface KnipExecutorOptions {
  projectRoot: string
  runtime?: "node" | "bun"
  strict?: boolean
  env?: Record<string, string>
}
