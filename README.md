![NPM](https://img.shields.io/npm/l/@berenddeboer/nx-aws-cdk)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

<hr>

# Nx plugin to generate an AWS cdk v2 package

A plugin to generate an AWS CDK v2 package. This code was based on a
collection of third-party Nx plugins based on Codebrew
(https://github.com/codebrewlab/nx-plugins) and Efacity
(https://github.com/efacity/nx-plugins). Codebrew no longer maintains
the plugin or accepts pull requests.

## Table of Contents

- [AWS CDK Nx Plugins](#aws-cdk-nx-plugins)
  - [Table of Contents](#table-of-contents)
  - [Maintainers](#maintainers)
  - [Contributing](#contributing)
  - [License](#license)

## Plugins

| Plugin                                                        | Description                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`@berenddeboer/nx-aws-cdk`](./packages/nx-aws-cdk/README.md) | An Nx plugin for developing [aws cdk stacks](https://docs.aws.amazon.com/cdk/latest/guide/home.html) |
| [`@berenddeboer/nx-sst`](./packages/nx-sst/README.md)         | An Nx plugin for developing [serverless full stack apps](https://docs.sst.dev/what-is-sst)           |

## Maintainers

[@berenddeboer](https://github.com/berenddeboer)

## Contributing

See [the contributing file](CONTRIBUTING.md)!

PRs accepted.

If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# Working on this code

Test:

```sh
npx nx test nx-aws-cdk
```

# Create a new package:

1. Build:

```sh
npx nx build nx-aws-cdk
```

2. Test:

```sh
npx nx test nx-aws-cdk
```

## License

This project is MIT licensed.
