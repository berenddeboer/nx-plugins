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
  const projectRoot = context.workspace.projects[context.projectName].root
  const normalizedOptions = normalizeOptions(options, context)
  const command = createCommand(options.command, normalizedOptions)
  return runCommandProcess(command, path.join(context.root, projectRoot))
}

function normalizeOptions(
  options: SSTRunExecutorSchema,
  context: ExecutorContext
): ParsedExecutorOption {
  let just_options = omit(options, "command")
  let stacks: string[]
  if (options.parameters) {
    stacks = options.parameters
    just_options = omit(just_options, "parameters")
  }
  const parsedArgs = parseArgs(just_options)

  // eslint-disable-next-line  no-unsafe-optional-chaining
  const { sourceRoot, root } = context?.workspace?.projects[context.projectName]

  return {
    ...just_options,
    parseArgs: parsedArgs,
    stacks,
    sourceRoot,
    root,
  }
}
