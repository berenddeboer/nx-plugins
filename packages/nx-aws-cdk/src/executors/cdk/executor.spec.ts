import * as path from "path"
import * as childProcess from "child_process"
import { logger } from "@nx/devkit"

import executor from "./executor"
import { CdkExecutorSchema } from "./schema"
import { LARGE_BUFFER } from "./lib/executor.util"
import { mockExecutorContext, cdk } from "./lib/testing"

jest.mock("child_process")

function mockExec() {
  const childProcessMock = {
    stdin: { write: jest.fn(), end: jest.fn() },
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    kill: jest.fn(),
    on: jest.fn(),
  }

  childProcessMock.on.mockImplementation(
    (event: string, listener: (code: number) => void) => {
      if (event === "close") listener(0)
      return childProcessMock
    }
  )
  ;(childProcess.exec as unknown as jest.Mock).mockReturnValue(childProcessMock)
}

describe("nx-aws-cdk cdk deploy Executor", () => {
  const options: CdkExecutorSchema = { command: "deploy" }
  const context = mockExecutorContext("cdk")

  beforeEach(async () => {
    jest.spyOn(logger, "debug")
    mockExec()
  })

  afterEach(() => jest.clearAllMocks())

  it("run cdk deploy command", async () => {
    await executor(options, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `${cdk} deploy`,
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.projectsConfigurations.projects["proj"].root)
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
    options_with_context.context = ["key=value"]
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
    mockExec()
  })

  afterEach(() => jest.clearAllMocks())

  it("run cdk synth command", async () => {
    await executor(options, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `${cdk} synth`,
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.projectsConfigurations.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: ${cdk} synth`)
  })

  it("run cdk synth command with an extra parameter", async () => {
    const extra_options: CdkExecutorSchema & { validation?: boolean } = Object.assign(
      {},
      options
    )
    extra_options["validation"] = true
    await executor(extra_options, context)

    expect(childProcess.exec).toHaveBeenCalledWith(
      `${cdk} synth --validation=true`,
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.projectsConfigurations.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: ${cdk} synth --validation=true`
    )
  })
})
