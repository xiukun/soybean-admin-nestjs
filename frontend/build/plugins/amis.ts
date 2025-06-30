import path from 'node:path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export function setupAmisPlugin() {
  // amis/sdk 不需要编译，直接复制到 dist 目录，否则editor 组件会报错

  return viteStaticCopy({
    targets: [
      {
        src: `${path.resolve(__dirname, '../../node_modules/amis/sdk').replace(/\\/g, '/')}/[!.]*`,
        dest: 'amis/sdk'
      }
    ]
  });
}
