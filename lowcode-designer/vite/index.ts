import type { PluginOption } from 'vite'
import createCompression from './compression'
import createHTML from './html'
export default function createVitePlugins(viteEnv, isBuild = false) {
  const vitePlugins: (PluginOption | PluginOption[])[] = []
  isBuild && vitePlugins.push(...createCompression(viteEnv))
  vitePlugins.push(createHTML(viteEnv, isBuild))

  return vitePlugins
}
