import { readNxJson, Tree, updateNxJson } from "@nx/devkit"

export function addPlugin(tree: Tree) {
  const nxJson = readNxJson(tree)
  nxJson.plugins ??= []

  let hasNxNuxtPlugin = false
  let hasNxVitePlugin = false

  for (const plugin of nxJson.plugins) {
    if (
      typeof plugin === "string"
        ? plugin === "@nx/nuxt/plugin"
        : plugin.plugin === "@nx/nuxt/plugin"
    ) {
      hasNxNuxtPlugin = true
    }
    if (
      typeof plugin === "string"
        ? plugin === "@nx/vite/plugin"
        : plugin.plugin === "@nx/vite/plugin"
    ) {
      hasNxVitePlugin = true
    }
  }

  if (!hasNxNuxtPlugin) {
    nxJson.plugins.push({
      plugin: "@nx/nuxt/plugin",
      options: {
        buildTargetName: "build",
        serveTargetName: "serve",
        serveStaticTargetName: "serve-static",
      },
    })
  }

  if (!hasNxVitePlugin) {
    nxJson.plugins.push({
      plugin: "@nx/vite/plugin",
      options: {
        buildTargetName: "build",
        previewTargetName: "preview",
        testTargetName: "test",
        serveTargetName: "serve",
        serveStaticTargetName: "serve-static",
      },
    })
  }

  updateNxJson(tree, nxJson)
}
