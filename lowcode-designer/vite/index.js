import createCompression from './compression';
import createHTML from './html';
export default function createVitePlugins(viteEnv, isBuild) {
    if (isBuild === void 0) { isBuild = false; }
    var vitePlugins = [];
    isBuild && vitePlugins.push.apply(vitePlugins, createCompression(viteEnv));
    vitePlugins.push(createHTML(viteEnv, isBuild));
    return vitePlugins;
}
