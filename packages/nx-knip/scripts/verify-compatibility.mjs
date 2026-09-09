import { execFileSync } from "node:child_process"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const knipVersions = process.argv.length > 2 ? process.argv.slice(2) : ["5.0.0", "5", "6"]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(scriptDirectory, "../../..")
const builtPackageRoot = join(workspaceRoot, "dist/packages/nx-knip")
const workspacePackage = JSON.parse(
  readFileSync(join(workspaceRoot, "package.json"), "utf8")
)
const nxVersion = workspacePackage.devDependencies.nx
const typescriptVersion = workspacePackage.devDependencies.typescript
const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  throw new Error("Run this compatibility check through pnpm")
}

function runPnpm(args, cwd) {
  execFileSync(process.execPath, [pnpmCli, ...args], { cwd, stdio: "inherit" })
}

const executorCheck = `
const executor = require("@berenddeboer/nx-knip/src/executors/knip/executor").default
executor(
  { projectRoot: "packages/example" },
  { root: process.cwd() }
).then(({ success }) => {
  if (!success) process.exitCode = 1
})
`

for (const knipVersion of knipVersions) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "nx-knip-compatibility-"))

  try {
    const projectRoot = join(fixtureRoot, "packages/example")
    mkdirSync(join(projectRoot, "src"), { recursive: true })

    runPnpm(["pack", "--pack-destination", fixtureRoot], builtPackageRoot)
    const packageArchive = readdirSync(fixtureRoot).find((file) => file.endsWith(".tgz"))
    if (!packageArchive) throw new Error("Failed to pack nx-knip")

    writeFileSync(
      join(fixtureRoot, "package.json"),
      JSON.stringify({
        name: "nx-knip-compatibility",
        private: true,
        dependencies: {
          "@berenddeboer/nx-knip": `file:./${packageArchive}`,
          "@nx/devkit": nxVersion,
          knip: knipVersion,
          nx: nxVersion,
          typescript: typescriptVersion,
        },
      })
    )
    writeFileSync(
      join(fixtureRoot, "pnpm-workspace.yaml"),
      'packages:\n  - "packages/*"\n'
    )
    writeFileSync(
      join(projectRoot, "package.json"),
      JSON.stringify({
        name: "example",
        version: "1.0.0",
        private: true,
        main: "src/index.js",
      })
    )
    writeFileSync(join(projectRoot, "src/index.js"), 'module.exports = "used"\n')

    runPnpm(
      [
        "install",
        "--strict-peer-dependencies",
        "--ignore-scripts",
        "--reporter=append-only",
      ],
      fixtureRoot
    )

    const installedKnip = JSON.parse(
      readFileSync(join(fixtureRoot, "node_modules/knip/package.json"), "utf8")
    )
    execFileSync(process.execPath, ["-e", executorCheck], {
      cwd: fixtureRoot,
      stdio: "inherit",
    })

    console.log(`Verified packaged nx-knip with Knip ${installedKnip.version}`)
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}
