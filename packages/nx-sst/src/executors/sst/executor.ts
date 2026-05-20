import * as path from "node:path"
import type { ExecutorContext } from "@nx/devkit"
import type { ParsedExecutorInterface } from "../../interfaces/parsed-executor.interface"
import { createCommand, parseArgs, runCommandProcess } from "../../utils/executor.util"
import type { SSTRunExecutorSchema } from "./schema"

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
  const projectName = context.projectName
  if (!projectName) throw new Error("No project name provided")

  const projectRoot = context.projectsConfigurations.projects[projectName].root
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

  const projectName = executor_context.projectName
  if (!projectName) throw new Error("No project name provided")

  const { sourceRoot, root } =
    executor_context.projectsConfigurations.projects[projectName]

  return {
    ...options,
    parseArgs: otherArgs,
    stacks: parameters,
    polyfills: polyfills,
    sourceRoot: sourceRoot ?? root,
    root,
  }
}
