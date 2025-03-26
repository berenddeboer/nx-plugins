import * as path from "path"
import { ExecutorContext } from "@nx/devkit"

import { CdkExecutorSchema } from "./schema"
import { createCommand, runCommandProcess, parseArgs } from "./lib/executor.util"
import { ParsedExecutorInterface } from "./lib/parsed-executor.interface"

export interface ParsedCdkExecutorOption extends ParsedExecutorInterface {
  command: string
  parseArgs?: Record<string, string>
  sourceRoot: string
  root: string
}

export default async function runExecutor(
  options: CdkExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const normalizedOptions = normalizeOptions(options, context)
  const result = await runCdk(normalizedOptions, context)

  return {
    success: result,
  }
}

async function runCdk(options: ParsedCdkExecutorOption, context: ExecutorContext) {
  const command = createCommand(options.command, options)
  return runCommandProcess(command, path.join(context.root, options.root))
}

function normalizeOptions(
  options: CdkExecutorSchema,
  executor_context: ExecutorContext
): ParsedCdkExecutorOption {
  const { context, ...unknown_properties } = options
  const otherArgs = parseArgs(unknown_properties)
  delete otherArgs.command
  delete otherArgs.stacks

  // If context values are passed, turn them into the proper object
  const context_values: Record<string, string> = {}
  if (context) {
    context.forEach((kv) => {
      const a = kv.split("=")
      context_values[a[0]] = a[1]
    })
  }

  // eslint-disable-next-line no-unsafe-optional-chaining
  const { projectName } = executor_context
  const { root, sourceRoot } = executor_context.projectsConfigurations.projects[projectName]

  return {
    ...options,
    context: context_values,
    otherArgs: otherArgs,
    sourceRoot,
    root,
  }
}
