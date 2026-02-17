# AGENTS.md

Guidance for AI coding agents working in this Nx plugins monorepo.

## Project Overview

Nx workspace with four custom Nx plugins (pnpm workspace):

- **@berenddeboer/nx-aws-cdk** — Self-inferring plugin for AWS CDK v2 (executor, generators, plugin inference from `cdk.json`)
- **@berenddeboer/nx-sst** — Plugin for SST v2 (executor, generators)
- **@berenddeboer/nx-biome** — Self-inferring plugin for Biome linter/formatter (executor, plugin inference)
- **@berenddeboer/nx-knip** — Self-inferring plugin for Knip unused code detection (executor, plugin inference)

## Build / Lint / Test Commands

```bash
# Build a plugin
pnpm nx build nx-aws-cdk
pnpm nx build nx-sst
pnpm nx build nx-biome
pnpm nx build nx-knip

# Lint a plugin
pnpm nx lint nx-aws-cdk

# Typecheck a plugin
pnpm nx typecheck nx-aws-cdk

# Run all tests for a plugin
pnpm nx test nx-aws-cdk

# Run a single test file
pnpm nx test nx-aws-cdk --testFile=src/executors/cdk/executor.spec.ts

# Run tests matching a pattern
pnpm nx test nx-aws-cdk --testNamePattern="deploy"

# Run all affected targets (what pre-commit runs)
pnpm nx affected --targets=lint,typecheck,test

# Format uncommitted files
pnpm nx format:write --uncommitted

# E2E tests
pnpm run e2e
```

## Project Structure

```
packages/nx-{name}/
  src/
    index.ts                  # Entry point / barrel exports
    plugins/plugin.ts         # Self-inferring plugin logic (CDK, biome, knip)
    executors/{name}/
      executor.ts             # Executor implementation (default export)
      executor.spec.ts        # Co-located tests
      schema.json             # JSON schema for options
      schema.d.ts             # TypeScript interface for schema
    generators/               # CDK and SST only
      init/                   # Hidden init generator
      application/ | app/     # App scaffold generator
    utils/                    # Shared utilities
  executors.json              # Executor definitions
  generators.json             # Generator definitions
  project.json               # Nx project config
e2e/nx-aws-cdk-e2e/           # E2E tests
```

## Code Style Guidelines

### Formatting (Prettier-enforced)

- **No semicolons**
- **Double quotes** for strings
- **2-space indentation**, spaces not tabs
- **90 character line width**
- **Trailing commas**: ES5 style (arrays/objects, not function params)
- **Arrow parens**: always — `(x) => ...`

### Imports

- Package imports first, then relative imports
- Use `"node:fs"`, `"node:path"`, `"node:child_process"` protocol for Node builtins in new code
- Use `import type { ... }` for type-only imports in new code
- Double quotes, no semicolons: `import { join } from "node:path"`

### Naming Conventions

| Element          | Convention               | Example                       |
| ---------------- | ------------------------ | ----------------------------- |
| Files            | kebab-case               | `executor.util.ts`            |
| Directories      | kebab-case               | `nx-aws-cdk`                  |
| Interfaces/Types | PascalCase               | `CdkExecutorSchema`           |
| Classes          | PascalCase               | `TempFs`                      |
| Functions        | camelCase                | `runCommandProcess`           |
| Variables        | camelCase                | `childProcess`                |
| Constants        | UPPER_SNAKE              | `LARGE_BUFFER`, `CDK_VERSION` |
| Schema types     | `{Tool}ExecutorSchema`   |                               |
| Generator opts   | `{Name}GeneratorOptions` |                               |

### TypeScript

- Target: ES2020, output: CommonJS
- Return types may be inferred (not always explicit)
- Use `eslint-disable` comments sparingly for specific lines only
- Prefer `interface` for object shapes, `type` for unions/intersections

### Export Patterns

- **Executors**: default export — `export default async function runExecutor(...)`
- **Generators**: named + default — `export async function applicationGenerator(...)` then `export default applicationGenerator`
- **Plugin inference**: named export `createNodesV2` (required by Nx API)
- **Barrel files**: `export * from "./module"` in `index.ts`

### Error Handling

- Executors return `{ success: boolean }` — never throw on command failure
- Newer plugins: try/catch around `execSync`, return `{ success: true/false }`
- Older plugins: wrap `child_process.exec` in a Promise, resolve `true`/`false` on exit code
- Use guard clauses with early returns for invalid states

## Testing Patterns

- **Jest** with `ts-jest` transform, tests co-located as `*.spec.ts`
- Run single test: `pnpm nx test nx-aws-cdk --testFile=src/executors/cdk/executor.spec.ts`
- Mocking: `jest.spyOn()` only, no external mock libraries
- Mock context: each plugin has a `testing.ts` with `mockExecutorContext()` factory
- Generator tests: use `createTreeWithEmptyWorkspace()` from `@nx/devkit/testing`
- Plugin tests: use `TempFs` class for temporary file systems
- Cleanup: `afterEach(() => jest.clearAllMocks())`
- E2E: uses `@nx/nx-plugin/testing` utilities with 120s timeouts

### Test Structure

```typescript
describe("nx-aws-cdk cdk deploy Executor", () => {
  beforeEach(async () => {
    jest.spyOn(logger, "debug")
    jest.spyOn(childProcess, "exec")
  })
  afterEach(() => jest.clearAllMocks())

  it("should run cdk deploy command", async () => {
    // arrange, act, assert
  })
})
```

## Commit Messages

Conventional commits enforced by commitlint. Max header: 140 chars.

```
type(scope): description
```

- **Types**: feat, fix, chore, docs, ci, build, perf, refactor, revert, style, test, sample, vendor
- **Scopes**: `nx-aws-cdk`, `nx-sst`, `nx-biome`, `nx-knip`
- Examples: `feat(nx-knip)!: add strict mode`, `fix(nx-biome): run biome from workspace root`

## Key Dependencies

- Nx 21.x, TypeScript 5.9.x, Jest 30.x, pnpm
- `@nx/devkit` for plugin APIs
- `@nx/js:tsc` for building all plugins
- `@jscutlery/semver` for versioning with conventional commits

## Pre-commit Hooks

Husky runs on every commit:

1. `lint-staged` — formats staged files with Prettier
2. `nx affected --targets=lint,typecheck,test` — checks affected projects

Ensure `pnpm nx lint <project>` and `pnpm nx test <project>` pass before committing.
