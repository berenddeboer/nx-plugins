# nx-sst

An Nx plugin which provides support for Serverless Stack (SST)
apps. Copied from
[otterdev-io/plugins](https://github.com/otterdev-io/nx-plugins) and
adapted for SST v2.

## Add the plugin to your workspace:

```sh
npm install @berenddeboer/nx-sst
```

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
