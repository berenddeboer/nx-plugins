import * as path from "path"
import * as childProcess from "child_process"
import { logger } from "@nx/devkit"

import executor from "./synth"
import { SynthExecutorSchema } from "./schema"
import { LARGE_BUFFER } from "../../utils/executor.util"
import { mockExecutorContext } from "../../utils/testing"

const options: SynthExecutorSchema = {}

describe("nx-aws-cdk synth Executor", () => {
  const context = mockExecutorContext("synth")

  beforeEach(async () => {
    jest.spyOn(logger, "debug")
    jest.spyOn(childProcess, "exec")
  })

  afterEach(() => jest.clearAllMocks())

  it("run cdk synth command", async () => {
    await executor(options, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      "cdk synth",
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.workspace.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: cdk synth`)
  })

  it("run cdk synth command stack", async () => {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const option: any = Object.assign({}, options)
    const stackName = "test"
    option["stacks"] = stackName
    await executor(option, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `cdk synth ${stackName}`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )

    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: cdk synth ${stackName}`
    )
  })

  it("run cdk synth command context options", async () => {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const option: any = Object.assign({}, options)
    const contextOptionString = "key=value"
    option["context"] = contextOptionString
    await executor(option, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `cdk synth --context ${contextOptionString}`,
      expect.objectContaining({
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )

    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: cdk synth --context ${contextOptionString}`
    )
  })
})
