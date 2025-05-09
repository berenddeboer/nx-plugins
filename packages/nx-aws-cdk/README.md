[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![@berenddeboer/nx-aws-cdk](https://img.shields.io/badge/%therk-nx--aws--cdk-green)](https://github.com/therk/nx-plugins/tree/master/packages/nx-aws-cdk)
[![Typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)
[![LICENSE](https://img.shields.io/npm/l/@codebrew/nx-aws-cdk.svg)](https://www.npmjs.com/package/@berenddeboer/nx-aws-cdk)
[![npm version](https://img.shields.io/npm/v/@codebrew/nx-aws-cdk.svg)](https://www.npmjs.com/package/@berenddeboer/nx-aws-cdk)
[![Downloads](https://img.shields.io/npm/dm/@codebrew/nx-aws-cdk.svg)](https://www.npmjs.com/package/@berenddeboer/nx-aws-cdk)

<hr>

# @berenddeboer/nx-aws-cdk

A self-inferring Nx plugin for developing [aws-cdk
applications](https://docs.aws.amazon.com/cdk/latest/guide/home.html).

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Generate Application](#generate-application)
  - [Targets](#targets)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```sh
# npm
npm install --save-dev @berenddeboer/nx-aws-cdk

# pnpm
pnpm i --save-dev @berenddeboer/nx-aws-cdk

# yarn
yarn add --dev @berenddeboer/nx-aws-cdk
```

## Usage

### Plugin

This package uses [inferred
targets](https://nx.dev/concepts/inferred-tasks) (tasks). Any project
with a `cdk.json` in its root will create the appropriate cdk targets
for that project.

You can configure the default target names in the plugin:

```json
{
  "plugin": "@berenddeboer/nx-aws-cdk/plugin",
  "options": {
	"cdkTargetName": "cdk",
	"synthTargetName": "synth",
	"deployTargetName": "deploy",
	"diffTargetName": "diff",
	"rollbackTargetName": "rollback",
	"watchTargetName": "watch",
	"destroyTargetName": "destroy"
  }
},
```

Remove a target if you do not want it auto-generated.

There's no need to use the executor anymore, but you can still use it
for non-inferred targets.

Use the cdk target to run any cdk command easily:

```sh
npx nx run my-stack:cdk import ...
```

### Generating a CDK application

To generate an [AWS CDK v2
Application](https://docs.aws.amazon.com/cdk/v2/guide/home.html):

```sh
npx nx generate @berenddeboer/nx-aws-cdk:application --directory=stacks/cdk-app --name=cdk-app
```

Currently (alpha 3 versions): do not specify a unit test runner or
eslint. This crashes nx for as yet unknown reasons.

You can customize it further by passing these options:

```
nx generate @berenddeboer/nx-aws-cdk:application [name] [options,...]

Options:
  --tags                     Add tags to the project (used for linting)
  --skipFormat               Skip formatting files
  --unitTestRunner           Adds the specified unit test runner (default: jest)
  --linter                   The tool to use for running lint checks. (default: eslint)
  --setParserOptionsProject  Whether or not to configure the ESLint "parserOptions.project" option. We do not do this by default for lint performance reasons.
  --dryRun                   Runs through and reports activity without writing to disk.
  --skip-nx-cache            Skip the use of Nx cache.
  --help                     Show available options for project target.
```

### Targets

Generated applications expose several functions to the CLI that allow users to deploy, destroy and so on.

```sh
nx deploy myApp
nx destroy myApp
```

We infer the most common cdk commands. Use the executor to have access
to all CDK commands.

## Contributing

See [the contributing file](../../CONTRIBUTING.md)!

PRs accepted.

If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

This project is MIT licensed.
