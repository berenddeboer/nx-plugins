import * as path from "path"
import { ExecutorContext } from "@nx/devkit"

import { SynthExecutorSchema } from "./schema"
import { createCommand, runCommandProcess, parseArgs } from "../../utils/executor.util"
import { ParsedExecutorInterface } from "../../interfaces/parsed-executor.interface"

export interface ParsedSynthExecutorOption extends ParsedExecutorInterface {
  parseArgs?: Record<string, string>
  stacks?: string[]
  sourceRoot: string
  root: string
}

export default async function runExecutor(
  options: SynthExecutorSchema,
  context: ExecutorContext
) {
  const normalizedOptions = normalizeOptions(options, context)
  const result = await runSynth(normalizedOptions, context)

  return {
    success: result,
  }
}

async function runSynth(options: ParsedSynthExecutorOption, context: ExecutorContext) {
  const command = createCommand("synth", options)
  return runCommandProcess(command, path.join(context.root, options.root))
}

function normalizeOptions(
  options: SynthExecutorSchema,
  context: ExecutorContext
): ParsedSynthExecutorOption {
  const parsedArgs = parseArgs(options)
  let stacks

  if (Object.prototype.hasOwnProperty.call(options, "stacks")) {
    stacks = options.stacks
  }

  // eslint-disable-next-line  no-unsafe-optional-chaining
  const { sourceRoot, root } = context?.workspace?.projects[context.projectName]

  return {
    ...options,
    parseArgs: parsedArgs,
    stacks,
    sourceRoot,
    root,
  }
}
