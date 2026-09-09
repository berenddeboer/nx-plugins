import * as childProcess from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path"

type KnipCli = "knip" | "knip-bun"

interface RunKnipOptions {
  workspaceRoot: string
  cli: KnipCli
  args: string[]
  env: NodeJS.ProcessEnv
  stdio: "inherit" | "pipe"
}

interface KnipPackageJson {
  name?: unknown
  bin?: unknown
}

function getBinPath(
  manifest: KnipPackageJson,
  cli: KnipCli,
  manifestPath: string
): string {
  const binPath =
    cli === "knip" && typeof manifest.bin === "string"
      ? manifest.bin
      : typeof manifest.bin === "object" && manifest.bin !== null
        ? (manifest.bin as Record<string, unknown>)[cli]
        : undefined

  if (typeof binPath !== "string" || binPath.length === 0) {
    throw new Error(
      `Knip package manifest "${manifestPath}" does not define a valid ` +
        `"bin.${cli}" entry.`
    )
  }

  return binPath
}

function resolveCliPath(
  packageRoot: string,
  binPath: string,
  manifestPath: string
): string {
  const cliPath = resolve(packageRoot, binPath)
  const relativePath = relative(packageRoot, cliPath)
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(
      `Knip CLI path "${binPath}" from manifest "${manifestPath}" resolves outside ` +
        `package root "${packageRoot}".`
    )
  }

  return cliPath
}

function findKnipPackageRoot(entryPath: string): string {
  let directory = dirname(entryPath)
  const filesystemRoot = parse(directory).root

  while (true) {
    const manifestPath = join(directory, "package.json")
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as KnipPackageJson
      if (manifest.name === "knip") return directory
    }

    if (directory === filesystemRoot) break
    directory = dirname(directory)
  }

  throw new Error(
    `Resolved "knip" to "${entryPath}", but could not find its owning package.json.`
  )
}

export function runKnip(options: RunKnipOptions): string {
  const requireFromWorkspace = createRequire(join(options.workspaceRoot, "package.json"))
  let entryPath: string
  try {
    entryPath = requireFromWorkspace.resolve("knip")
  } catch {
    throw new Error(
      `Unable to resolve the "knip" package from workspace root "${options.workspaceRoot}". ` +
        "Install knip in the workspace."
    )
  }
  const packageRoot = findKnipPackageRoot(entryPath)
  const manifestPath = join(packageRoot, "package.json")
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as KnipPackageJson
  const binPath = getBinPath(manifest, options.cli, manifestPath)
  const cliPath = resolveCliPath(packageRoot, binPath, manifestPath)
  if (!existsSync(cliPath)) {
    throw new Error(
      `Knip CLI "${options.cli}" points to missing file "${cliPath}" ` +
        `(declared in "${manifestPath}").`
    )
  }
  if (!statSync(cliPath).isFile()) {
    throw new Error(
      `Knip CLI "${options.cli}" path "${cliPath}" is not a file ` +
        `(declared in "${manifestPath}").`
    )
  }
  const interpreter = options.cli === "knip" ? process.execPath : "bun"

  return childProcess.execFileSync(interpreter, [cliPath, ...options.args], {
    cwd: options.workspaceRoot,
    encoding: "utf8",
    env: options.env,
    stdio: options.stdio,
    windowsHide: true,
  })
}
