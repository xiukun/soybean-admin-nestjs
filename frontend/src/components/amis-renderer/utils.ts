import { MaitaGlobalConfig } from '@maita/amis-tools';

/** 设置Amis配置 */
export const setupAmisConfig = () => {
  const _cf = new MaitaGlobalConfig();
  (() => {
    // 定义的通用window方法，供amis设计器使用
    const newJsFunc = {
      /**
       * 浏览器动态列缓存
       *
       * @param ctx amis context上下文
       * @param event amis event事件
       * @param clear 是否清除 默认false
       */
      dynimicColumnCache: (_ctx: any, _event: any, _clear: boolean = false) => {},
      dynimicColumnSave: (_ctx: any, _event: any, _clear: boolean = false) => {}
    };

    Object.assign((window as any).__JSFunc, newJsFunc);
  })();
};
