import * as path from "path"
import * as childProcess from "child_process"
import { logger } from "@nx/devkit"

import executor from "./executor"
import { SSTRunExecutorSchema } from "./schema"
import { LARGE_BUFFER } from "../../utils/executor.util"
import { mockExecutorContext } from "../../utils/testing"

const options: SSTRunExecutorSchema = {
  command: "version",
}

describe("SST Run Executor", () => {
  const context = mockExecutorContext("version")

  beforeEach(async () => {
    jest.spyOn(logger, "debug")
    jest.spyOn(childProcess, "exec")
  })

  afterEach(() => jest.clearAllMocks())

  it("can run", async () => {
    await executor(options, context)
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
})
