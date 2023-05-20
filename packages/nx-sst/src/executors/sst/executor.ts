import * as path from "path"
import { SSTRunExecutorSchema } from "./schema"
import { ExecutorContext } from "@nx/devkit"
import { createCommand, runCommandProcess, parseArgs } from "../../utils/executor.util"

export default async function runExecutor(
  options: SSTRunExecutorSchema,
  context: ExecutorContext
) {
  const projectRoot = context.workspace.projects[context.projectName].root
  /*
  const stage = options.stage ? `--stage ${options.stage}` : ""
  const region = options.region ? `--region ${options.region}` : ""
  const roleArn = options.roleArn ? `--role-arn ${options.roleArn}` : ""
  const parameters = options.parameters?.join(" ") ?? ""
  const noColor = options.noColor ? "--no-color" : ""
  const verbose = options.verbose ? "--verbose" : ""
   */

  const command = createCommand(options.command, options)
  return runCommandProcess(command, path.join(context.root, projectRoot))
}
