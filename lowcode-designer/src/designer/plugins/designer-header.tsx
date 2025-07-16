import { render as renderAmis } from 'amis'
import { Button, Select, toast, confirm } from 'amis-ui'
import { ShortcutKey } from 'amis-editor'
import useAmisStore, { useAmisStoreContext } from '@/store/amis-store'
import { languagesList } from '@/utils/amis'
import { getI18N, i18nExtendEnum } from '@/components/common/utils'
import useMenusStore from '@/store/menus-store'
import { memo, useEffect } from 'react'
import { replaceUrlParam } from '@/utils/utils'
import serviceUrlSchema from './service-url-schema.json'
import hotkeys from 'hotkeys-js'
function DesignerHeader(props: any) {
  useEffect(() => {
    // 绑定快捷键 Ctrl+S 触发 save 函数
    hotkeys('ctrl+s,command+s', function(event){
      // 阻止事件的默认动作，避免页面保存
      event.preventDefault();
      if(props.editorType === 'html') {
        onSave();
      } else if(props.editorType === 'plugin') {
        onSavePlugin();
      }
    });

    // 清理函数，用于移除快捷键绑定
    return () => {
      hotkeys.unbind('ctrl+s,command+s');
    };
  }, []); // 确保只在组件挂载时绑定一次
  const store = useAmisStore()
  const useCtx = useAmisStoreContext()
  const menusCtx = useMenusStore()
  // 强制刷新
  const onForceRefresh = () => {
    location.href = replaceUrlParam(location.href, 't', new Date().getTime() + '')
  }
  const onDictionarySave = () => {
    useCtx.onDictionarySave()
    menusCtx.cacheMenus()
    toast.success('数据字典缓存成功')
  }
  const onSave = () => {
    useCtx.onSave()
  }
  const onSavePlugin = () => {
    useCtx.onSavePlugin()
  }
  const onClear = () => {
    confirm('真的要清空吗？', '清空确认').then(state => {
      if (state) useCtx.onClear()
    })
  }
  const onExit = () => {
    console.log('退出操作')
  }
  const renderSaveBtn = () => {
    if (props.editorType === 'html') {
      return (
        <div className="mr-1">
          <Button onClick={onSave}>{getI18N(i18nExtendEnum.保存)}</Button>
        </div>
      )
    } else if (props.editorType === 'plugin') {
      return (
        <div className="mr-1">
          <Button onClick={onSavePlugin}>{getI18N(i18nExtendEnum.保存)}</Button>
        </div>
      )
    }
  }
  const renderServiceUrl = () => {
    const searchParams = new URLSearchParams(location.hash || location.search)
    return searchParams.get('dev') ? renderAmis(serviceUrlSchema) : undefined
  }

  return (
    <>
      <div className="header">
        <div className="editor-title">{props.title} </div>
        <div className="editor-view-mode-group-container">
          <div className="editor-view-mode-group">
            <div
              className={`editor-view-mode-btn editor-header-icon ${
                !store.isMobile ? 'is-active' : ''
              }`}
              onClick={() => {
                store.setData('isMobile', false)
              }}
            >
              {renderAmis({ type: 'icon', icon: 'laptop' })}
            </div>
            <div
              className={`editor-view-mode-btn editor-header-icon ${
                store.isMobile ? 'is-active' : ''
              }`}
              onClick={() => {
                store.setData('isMobile', true)
              }}
            >
              {renderAmis({ type: 'icon', icon: 'mobile' })}
            </div>
          </div>
        </div>
        <div className="editor-header-actions">
          <div className="mr-1">{renderServiceUrl()}</div>
          <ShortcutKey />
          <div className="ml-1">
            <Button onClick={onDictionarySave}>{getI18N(i18nExtendEnum.刷新数据)}</Button>
          </div>
          <div
            className={`header-action-btn m-1 ${store.isProview ? 'primary' : ''}`}
            onClick={() => {
              store.setData('isProview', !store.isProview)
            }}
          >
            {store.isProview ? getI18N(i18nExtendEnum.编辑) : getI18N(i18nExtendEnum.预览)}
          </div>
          <div className="mr-1">
            <Select
              options={languagesList}
              value={store.language}
              clearable={false}
              onChange={(e: any) => store.onChangeLocale(e.value)}
            />
          </div>
          <div className="mr-1">
            <Button onClick={onClear}>{getI18N(i18nExtendEnum.清空)}</Button>
          </div>

          {renderSaveBtn()}

          <div className="mr-1">
            <Button level="light" onClick={onForceRefresh}>
              强制刷新
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
export default memo(DesignerHeader)
