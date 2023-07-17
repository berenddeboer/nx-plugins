[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![@berenddeboer/nx-aws-cdk](https://img.shields.io/badge/%therk-nx--aws--cdk-green)](https://github.com/therk/nx-plugins/tree/master/packages/nx-aws-cdk)
[![Typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)
[![LICENSE](https://img.shields.io/npm/l/@codebrew/nx-aws-cdk.svg)](https://www.npmjs.com/package/@berenddeboer/nx-aws-cdk)
[![npm version](https://img.shields.io/npm/v/@codebrew/nx-aws-cdk.svg)](https://www.npmjs.com/package/@berenddeboer/nx-aws-cdk)
[![Downloads](https://img.shields.io/npm/dm/@codebrew/nx-aws-cdk.svg)](https://www.npmjs.com/package/@berenddeboer/nx-aws-cdk)

<hr>

# @berenddeboer/nx-aws-cdk

An Nx plugin for developing [aws-cdk applications](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
Based on !codebrew/nx-aws-cdk

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Generate Application](#generate-application)
  - [Targets](#targets)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```shell
# npm
npm install --save-dev @berenddeboer/nx-aws-cdk

# yarn
yarn add --dev @berenddeboer/nx-aws-cdk
```

## Usage

### Generate Application

Create AWS CDK v2 Application

More details on AWS CDK v2 can be found on https://docs.aws.amazon.com/cdk/v2/guide/home.html

```shell
nx generate @berenddeboer/nx-aws-cdk:application myApp
```

you can customize it further by passing these options:

```
nx generate @berenddeboer/nx-aws-cdk:application [name] [options,...]

Options:
  --tags                     Add tags to the project (used for linting)
  --directory                A directory where the project is placed
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

```shell
nx deploy myApp
nx destroy myApp
```

All CDK commands are supported, although only the common targets are emitted.

## Upgrading to version 2

Update your `project.json` when upgrading from an earlier version:

1. Replace the `@berenddeboer/nx-aws-cdk:*` plugin with `@berenddeboer/nx-aws-cdk:cdk`

2. Under the options property add the CDK command like `synth` or `deploy`.

Example:

```json
"deploy": {
  "executor": "@berenddeboer/nx-aws-cdk:cdk",
  "options": {
    "command": "deploy"
  },
  "outputs": ["{workspaceRoot}/dist/{projectRoot}"]
},
```

## Maintainers

[@therk](https://github.com/therk)
[@tienne](https://github.com/tienne) Used to maintain the original plugin under Codebrew

## Contributing

See [the contributing file](../../CONTRIBUTING.md)!

PRs accepted.

If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

This project is MIT licensed.
