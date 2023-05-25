import * as path from "path"
import * as childProcess from "child_process"
import { logger } from "@nx/devkit"

import executor from "./executor"
import { SSTRunExecutorSchema } from "./schema"
import { LARGE_BUFFER } from "../../utils/executor.util"
import { mockExecutorContext } from "../../utils/testing"

const version: SSTRunExecutorSchema = {
  command: "version",
}

const deploy: SSTRunExecutorSchema = {
  command: "deploy",
  stage: "prd",
}

const deploy_stack: SSTRunExecutorSchema = {
  command: "deploy",
  stage: "prd",
  parameters: ["mystack"],
}

const empty_parameters: SSTRunExecutorSchema = {
  command: "deploy",
  stage: "prd",
  parameters: [],
}

describe("SST Run Executor", () => {
  const context = mockExecutorContext("version")

  beforeEach(async () => {
    jest.spyOn(logger, "debug")
    jest.spyOn(childProcess, "exec")
  })

  afterEach(() => jest.clearAllMocks())

  it("can run", async () => {
    await executor(version, context)
    expect(childProcess.exec).toHaveBeenCalledWith(
      "sst version",
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.workspace.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(`Executing command: sst version`)
  })

  it("can receive stage parameter", async () => {
    await executor(deploy, context)
    expect(childProcess.exec).toHaveBeenCalledWith(
      "sst deploy --stage prd",
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.workspace.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: sst deploy --stage prd`
    )
  })

  it("can receive stack to deploy", async () => {
    await executor(deploy_stack, context)
    expect(childProcess.exec).toHaveBeenCalledWith(
      "sst deploy --stage prd mystack",
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.workspace.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: sst deploy --stage prd mystack`
    )
  })

  it("ignores empty parameters", async () => {
    await executor(empty_parameters, context)
    expect(childProcess.exec).toHaveBeenCalledWith(
      "sst deploy --stage prd",
      expect.objectContaining({
        cwd: expect.stringContaining(
          path.join(context.root, context.workspace.projects["proj"].root)
        ),
        env: process.env,
        maxBuffer: LARGE_BUFFER,
      })
    )
    expect(logger.debug).toHaveBeenLastCalledWith(
      `Executing command: sst deploy --stage prd`
    )
  })
})
