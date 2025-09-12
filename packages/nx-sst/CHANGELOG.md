# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.0.0](https://github.com/berenddeboer/nx-plugins/compare/nx-sst-0.13.6...nx-sst-1.0.0) (2025-09-12)

### ⚠ BREAKING CHANGES

- **nx-sst:** nx-sst now requires @nx/eslint as a peer dependency instead of the deprecated @nx/linter. Users must install @nx/eslint ^20.6.4 alongside this package.

This fixes the "Cannot find module '@nx/linter'" error when generating SST applications.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>

### Features

- **nx-sst:** add @nx/eslint peer dependency ([45474f6](https://github.com/berenddeboer/nx-plugins/commit/45474f6deb5b08ffd4bcae557b810ca76202d5f4))

## [0.13.6](https://github.com/berenddeboer/nx-plugins/compare/nx-sst-0.13.5...nx-sst-0.13.6) (2025-09-12)

0.0.1 - Sep 3 2021

- Initial release
