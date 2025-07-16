import { Suspense, memo, useEffect } from 'react'
import Amis from '@/designer/amis-designer'
import registerCompoments from '@/designer/register'
import { Spinner } from 'amis-ui'

import '@/utils/monaco'
import { registerCustomFilters } from '@/designer/filters'
import { registerCustomI18n } from '@/designer/ i18n'
import { initDictionary } from '@/utils/dictionary'
import useMenusStore from '@/store/menus-store'
registerCustomI18n() // 注册多语言
registerCustomFilters() // 注册过滤方法
registerCompoments() // 注册自定义组件

function FlowEditor() {
  const menusCtx = useMenusStore()
  useEffect(() => {
    initDictionary() // 初始化时自动加载数据字典并缓存
    menusCtx.initMenus() // 初始化时自动加载菜单并缓存
  }, [])
  return (
    <>
      <Suspense fallback={<Spinner overlay className="m-t-lg" size="lg" />}>
        <Amis title="岸基工作流设计器" editorType="flow" />
      </Suspense>
    </>
  )
}

export default memo(FlowEditor)
