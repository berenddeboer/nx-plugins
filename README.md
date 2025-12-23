![NPM](https://img.shields.io/npm/l/@berenddeboer/nx-aws-cdk)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

<hr>

# About

Nx monorepo for various Nx plugins

## Plugins

| Plugin                                                        | Description                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`@berenddeboer/nx-aws-cdk`](./packages/nx-aws-cdk/README.md) | An Nx plugin for developing [aws cdk stacks](https://docs.aws.amazon.com/cdk/latest/guide/home.html) |
| [`@berenddeboer/nx-biome`](./packages/nx-biome/README.md)     | An Nx plugin for linting and formatting with [Biome](https://biomejs.dev/)                           |
| [`@berenddeboer/nx-knip`](./packages/nx-knip/README.md)       | An Nx plugin for finding unused dependencies, exports, and files with [Knip](https://knip.dev/)      |
| [`@berenddeboer/nx-sst`](./packages/nx-sst/README.md)         | An Nx plugin for developing [serverless full stack apps](https://docs.sst.dev/what-is-sst)           |

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

3. To publish, use the Publish workflow in GitHub actions and select the project to publish.

## License

This project is MIT licensed.
