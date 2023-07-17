import * as path from "path"
import * as childProcess from "child_process"
import { logger } from "@nx/devkit"

import executor from "./executor"
import { CdkExecutorSchema } from "./schema"
import { LARGE_BUFFER } from "../../utils/executor.util"
import { mockExecutorContext, cdk } from "../../utils/testing"

describe("nx-aws-cdk cdk deploy Executor", () => {
  const options: CdkExecutorSchema = { command: "deploy" }
  const context = mockExecutorContext("cdk")

  beforeEach(async () => {
    jest.spyOn(logger, "debug")
    jest.spyOn(childProcess, "exec")
  })

  afterEach(() => jest.clearAllMocks())

  it("run cdk deploy command", async () => {
    await executor(options, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `${cdk} deploy`,
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.workspace.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${cdk} deploy`)
  })

  it("run cdk deploy command stack", async () => {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const option: any = Object.assign({}, options)
    const stackName = "test"
    option["stacks"] = stackName
    await executor(option, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `${cdk} deploy ${stackName}`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )

    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: ${cdk} deploy ${stackName}`
    )
  })

  it("run cdk deploy command context options", async () => {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const options_with_context: CdkExecutorSchema = Object.assign({}, options)
    options_with_context.context = {
      key: "value",
    }
    await executor(options_with_context, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `${cdk} deploy --context key=value`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )

    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: ${cdk} deploy --context key=value`
    )
  })
})

describe("nx-aws-cdk cdk synth Executor", () => {
  const options: CdkExecutorSchema = { command: "synth" }
  const context = mockExecutorContext("cdk")

  beforeEach(async () => {
    jest.spyOn(logger, "debug")
    jest.spyOn(childProcess, "exec")
  })

  afterEach(() => jest.clearAllMocks())

  it("run cdk synth command", async () => {
    await executor(options, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `${cdk} synth`,
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.workspace.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${cdk} synth`)
  })
})
