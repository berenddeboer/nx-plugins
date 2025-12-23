# @berenddeboer/nx-knip

A self-inferring Nx plugin for [Knip](https://knip.dev/) - find unused dependencies, exports, and files in your JavaScript/TypeScript projects.

## Install

<details open>
<summary>npm</summary>

```sh
npm install --save-dev @berenddeboer/nx-knip
```

</details>

<details>
<summary>pnpm</summary>

```sh
pnpm add --save-dev @berenddeboer/nx-knip
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn add --dev @berenddeboer/nx-knip
```

</details>

<details>
<summary>bun</summary>

```sh
bun add -D @berenddeboer/nx-knip
```

</details>

## Usage

The plugin automatically adds a `knip` target to all projects that have a `package.json`. Run it with:

```bash
nx knip my-project
```

Or run it for all projects:

```bash
nx run-many -t knip
```

## How it works

This plugin runs `knip --workspace {projectRoot}` from the workspace root for each project. This means:

1. It uses the `--workspace` flag to focus on a specific workspace
2. The workspace root `knip.json` configuration is used
3. If [Bun](https://bun.sh) is installed, the plugin automatically uses `knip-bun` for significantly better performance

## Plugin Options

You can customize the target name in your `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@berenddeboer/nx-knip/plugin",
      "options": {
        "targetName": "check-unused"
      }
    }
  ]
}
```

## Learn More

- [Knip Documentation](https://knip.dev/)
- [Nx Plugins](https://nx.dev/concepts/nx-plugins)
