# nx-sst

An Nx plugin which provides support for Serverless Stack (SST)
apps. Copied from
[otterdev-io/plugins](https://github.com/otterdev-io/nx-plugins) and
adapted for SST v2.

The plugin works with SST v3 as well, but cannot yet generate an application.

## Add the plugin to your workspace:

<details open>
<summary>npm</summary>

```sh
npm install @berenddeboer/nx-sst
```

</details>

<details>
<summary>pnpm</summary>

```sh
pnpm i @berenddeboer/nx-sst
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn add @berenddeboer/nx-sst
```

</details>

<details>
<summary>bun</summary>

```sh
bun add @berenddeboer/nx-sst
```

</details>

## Create a typescript sst app:

```sh
nx g @berenddeboer/nx-sst:app <app name>
```

All SST commands are supported.

To see all options:

```sh
npx nx g @berenddeboer/nx-sst:app --help
```

## Local debugging

For example, if your project is named app:

`nx run app:dev` or `nx dev app`

## Deploy

```
nx run app:deploy
```

## Deploy to a stage

```
nx run app:deploy --stage=production
```
