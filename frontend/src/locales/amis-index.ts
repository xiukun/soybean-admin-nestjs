/** amis 国际化语言包处理模块 用于加载和管理 amis 组件的语言包 */

// 导入应用的语言类型
import { localStg } from '@/utils/storage';

// 默认语言标签
const languageLabel = localStg.get('lang') || 'zh-CN';

// 语言数据存储
let languageData: Record<string, any> = {};

/**
 * 获取语言数据基础模块
 *
 * @returns 返回语言模块的导入函数映射
 */
function getLanguageDataByBase(): Record<string, () => Promise<{ default: Record<string, any> }>> {
  return import.meta.glob<{ default: Record<string, any> }>('../locales/amis-lang/**/*.js');
}

/**
 * 异步加载指定语言的语言包
 *
 * @param locale 语言代码
 * @param modules 语言模块映射
 * @returns 加载完成的语言数据
 */
async function getLanguagePacks(
  modules: Record<string, () => Promise<{ default: Record<string, any> }>>,
  locale = 'zh-CN'
): Promise<Record<string, any>> {
  try {
    const list = Object.keys(modules);
    for (let index = 0; index < list.length; index++) {
      const path = list[index];
      if (path.endsWith(`${locale}.js`)) {
        // eslint-disable-next-line no-await-in-loop
        const module = await modules[path]();
        return module.default;
      }
    }
    console.warn(`未找到语言包: ${locale}，将使用默认语言包`);
    return {};
  } catch (error) {
    console.error(`加载语言包出错:`, error);
    return {};
  }
}

/**
 * 获取选定的语言包
 *
 * @param lang 语言代码
 * @returns 语言包数据
 */
export async function getSelectedLangPack(lang: string): Promise<Record<string, any>> {
  const selectedLang = lang || languageLabel;
  const languageDataBase = getLanguageDataByBase();

  try {
    languageData = await getLanguagePacks(languageDataBase, selectedLang);
    return languageData;
  } catch (error) {
    console.error(`获取语言包失败:`, error);
    return {};
  }
}
