import * as path from "path"
import { omit } from "lodash"
import { SSTRunExecutorSchema } from "./schema"
import { ExecutorContext } from "@nx/devkit"
import { createCommand, runCommandProcess, parseArgs } from "../../utils/executor.util"
import { ParsedExecutorInterface } from "../../interfaces/parsed-executor.interface"

export interface ParsedExecutorOption extends ParsedExecutorInterface {
  parseArgs?: Record<string, string>
  sourceRoot: string
  root: string
}

export default async function runExecutor(
  options: SSTRunExecutorSchema,
  context: ExecutorContext
) {
  const normalizedOptions = normalizeOptions(options, context)
  const result = await runSst(options.command, normalizedOptions, context)

  return {
    success: result,
  }
}

function runSst(
  subcommand: string,
  options: ParsedExecutorInterface,
  context: ExecutorContext
) {
  const projectRoot = context.workspace.projects[context.projectName].root
  const command = createCommand(subcommand, options)
  return runCommandProcess(command, path.join(context.root, projectRoot))
}

function normalizeOptions(
  options: SSTRunExecutorSchema,
  executor_context: ExecutorContext
): ParsedExecutorOption {
  const { polyfills, parameters, ...unknown_properties } = options
  const otherArgs = parseArgs(unknown_properties)
  delete otherArgs.command
  delete otherArgs.parameters

  // eslint-disable-next-line  no-unsafe-optional-chaining
  const { sourceRoot, root } =
    executor_context?.workspace?.projects[executor_context.projectName]

  return {
    ...options,
    parseArgs: otherArgs,
    stacks: parameters,
    polyfills: polyfills,
    sourceRoot,
    root,
  }
}
