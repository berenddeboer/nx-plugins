import * as path from "path"
import { ExecutorContext } from "@nx/devkit"

import { CdkExecutorSchema } from "./schema"
import { createCommand, runCommandProcess, parseArgs } from "../../utils/executor.util"
import { ParsedExecutorInterface } from "../../interfaces/parsed-executor.interface"

export interface ParsedCdkExecutorOption extends ParsedExecutorInterface {
  command: string
  parseArgs?: Record<string, string>
  sourceRoot: string
  root: string
}

export default async function runExecutor(
  options: CdkExecutorSchema,
  context: ExecutorContext
): Promise<{ success: Boolean }> {
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
  context: ExecutorContext
): ParsedCdkExecutorOption {
  const parsedArgs = parseArgs(options)

  // eslint-disable-next-line  no-unsafe-optional-chaining
  const { sourceRoot, root } = context?.workspace?.projects[context.projectName]

  return {
    ...options,
    parseArgs: parsedArgs,
    sourceRoot,
    root,
  }
}
