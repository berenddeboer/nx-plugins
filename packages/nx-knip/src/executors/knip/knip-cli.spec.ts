import * as childProcess from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runKnip } from "./knip-cli"

jest.mock("child_process")

describe("runKnip", () => {
  let workspaceRoot: string

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), "nx knip workspace & "))
    writeFileSync(join(workspaceRoot, "package.json"), "{}")
  })

  afterEach(() => {
    jest.restoreAllMocks()
    rmSync(workspaceRoot, { recursive: true, force: true })
  })

  it("runs the workspace-installed Knip CLI through Node", () => {
    const packageRoot = join(workspaceRoot, "node_modules", "knip")
    const entryPath = join(packageRoot, "dist", "deep", "entry.js")
    const cliPath = join(packageRoot, "scripts & tools", "knip cli.js")
    mkdirSync(join(packageRoot, "dist", "deep"), { recursive: true })
    mkdirSync(join(packageRoot, "scripts & tools"), { recursive: true })
    writeFileSync(entryPath, "")
    writeFileSync(
      join(packageRoot, "dist", "deep", "package.json"),
      JSON.stringify({ name: "knip-internal" })
    )
    writeFileSync(cliPath, "")
    writeFileSync(
      join(packageRoot, "package.json"),
      JSON.stringify({
        name: "knip",
        exports: { ".": "./dist/deep/entry.js" },
        bin: { knip: "scripts & tools/knip cli.js" },
      })
    )
    const execFileSync = jest.mocked(childProcess.execFileSync).mockReturnValue("")

    runKnip({
      workspaceRoot,
      cli: "knip",
      args: ["--workspace", "packages/project & tools"],
      env: process.env,
      stdio: "inherit",
    })

    expect(execFileSync).toHaveBeenCalledWith(
      process.execPath,
      [cliPath, "--workspace", "packages/project & tools"],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        env: process.env,
        stdio: "inherit",
        windowsHide: true,
      }
    )
  })

  it("runs the workspace-installed knip-bun CLI through Bun", () => {
    const packageRoot = join(workspaceRoot, "node_modules", "knip")
    const entryPath = join(packageRoot, "lib", "entry.js")
    const cliPath = join(packageRoot, "bin", "knip-bun.js")
    mkdirSync(join(packageRoot, "lib"), { recursive: true })
    mkdirSync(join(packageRoot, "bin"), { recursive: true })
    writeFileSync(entryPath, "")
    writeFileSync(cliPath, "")
    writeFileSync(
      join(packageRoot, "package.json"),
      JSON.stringify({
        name: "knip",
        exports: { ".": "./lib/entry.js" },
        bin: { "knip-bun": "bin/knip-bun.js" },
      })
    )
    const execFileSync = jest.mocked(childProcess.execFileSync).mockReturnValue("")

    runKnip({
      workspaceRoot,
      cli: "knip-bun",
      args: ["--workspace", "packages/project"],
      env: process.env,
      stdio: "pipe",
    })

    expect(execFileSync).toHaveBeenCalledWith(
      "bun",
      [cliPath, "--workspace", "packages/project"],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        env: process.env,
        stdio: "pipe",
        windowsHide: true,
      }
    )
  })

  it("explains when Knip is not installed in the workspace", () => {
    expect(() =>
      runKnip({
        workspaceRoot,
        cli: "knip",
        args: [],
        env: process.env,
        stdio: "inherit",
      })
    ).toThrow(
      `Unable to resolve the "knip" package from workspace root "${workspaceRoot}". ` +
        "Install knip in the workspace."
    )
  })

  it("explains when the resolved entry has no owning Knip manifest", () => {
    const packageRoot = join(workspaceRoot, "node_modules", "knip")
    const entryPath = join(packageRoot, "index.js")
    mkdirSync(packageRoot, { recursive: true })
    writeFileSync(entryPath, "")

    expect(() =>
      runKnip({
        workspaceRoot,
        cli: "knip",
        args: [],
        env: process.env,
        stdio: "inherit",
      })
    ).toThrow(
      `Resolved "knip" to "${entryPath}", but could not find its owning package.json.`
    )
  })

  it("explains when the requested CLI is missing from the package manifest", () => {
    const packageRoot = join(workspaceRoot, "node_modules", "knip")
    const entryPath = join(packageRoot, "index.js")
    const manifestPath = join(packageRoot, "package.json")
    mkdirSync(packageRoot, { recursive: true })
    writeFileSync(entryPath, "")
    writeFileSync(
      manifestPath,
      JSON.stringify({ name: "knip", main: "index.js", bin: { knip: "bin/knip.js" } })
    )

    expect(() =>
      runKnip({
        workspaceRoot,
        cli: "knip-bun",
        args: [],
        env: process.env,
        stdio: "inherit",
      })
    ).toThrow(
      `Knip package manifest "${manifestPath}" does not define a valid ` +
        '"bin.knip-bun" entry.'
    )
  })

  it("rejects a CLI path that escapes the Knip package", () => {
    const packageRoot = join(workspaceRoot, "node_modules", "knip")
    const entryPath = join(packageRoot, "index.js")
    const manifestPath = join(packageRoot, "package.json")
    mkdirSync(packageRoot, { recursive: true })
    writeFileSync(entryPath, "")
    writeFileSync(
      manifestPath,
      JSON.stringify({ name: "knip", main: "index.js", bin: { knip: "../outside.js" } })
    )

    expect(() =>
      runKnip({
        workspaceRoot,
        cli: "knip",
        args: [],
        env: process.env,
        stdio: "inherit",
      })
    ).toThrow(
      `Knip CLI path "../outside.js" from manifest "${manifestPath}" resolves outside ` +
        `package root "${packageRoot}".`
    )
  })

  it("explains when the declared CLI file does not exist", () => {
    const packageRoot = join(workspaceRoot, "node_modules", "knip")
    const entryPath = join(packageRoot, "index.js")
    const cliPath = join(packageRoot, "bin", "knip.js")
    const manifestPath = join(packageRoot, "package.json")
    mkdirSync(packageRoot, { recursive: true })
    writeFileSync(entryPath, "")
    writeFileSync(
      manifestPath,
      JSON.stringify({ name: "knip", main: "index.js", bin: { knip: "bin/knip.js" } })
    )

    expect(() =>
      runKnip({
        workspaceRoot,
        cli: "knip",
        args: [],
        env: process.env,
        stdio: "inherit",
      })
    ).toThrow(
      `Knip CLI "knip" points to missing file "${cliPath}" ` +
        `(declared in "${manifestPath}").`
    )
  })
})
