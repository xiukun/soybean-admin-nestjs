import { memo } from 'react'
import { Icon, render as renderAmis } from 'amis'

import { BuildPanelEventContext, BasePlugin, BasicPanelItem } from 'amis-editor'
// import BatchAdd from './batch-add'
import pageJson from './api-json.tsx'

/**
 * 左侧 数据库接口
 */
export default class LeftDatabaseApi extends BasePlugin {
  static scene = ['layout']
  order = -9999

  buildEditorPanel(context: BuildPanelEventContext, panels: Array<BasicPanelItem>) {
    const store = this.manager.store
    // 多选时显示大纲面板
    if (store && context.selections.length) {
      const { changeLeftPanelOpenStatus, changeLeftPanelKey } = store
      changeLeftPanelOpenStatus(true)
      changeLeftPanelKey('commonTpl')
    }
    panels.push({
      key: 'databaseApi',
      icon: '',
      title: (
        <span className="editor-tab-icon plugin-left-menu-icon" editor-tooltip="数据接口">
          <Icon icon="fa fa-database" />
        </span>
      ),
      component: memo(DatabaseApi),
      position: 'left',
      order: 5200,
    })
  }
}

function DatabaseApi(_props: any) {
  const renderHtml = () => {
    return (
      <>
        <div className="w-full h-full flex flex-col">
          {/* <div className="flex justify-end">
            <BatchAdd /> &nbsp;
            {renderAmis(addJson)} &nbsp;
          </div> */}
          {renderAmis(pageJson)}</div>
      </>
    )
  }
  return (
    <>
      <div className="ae-CodePanel">
        <div className="panel-header">数据接口</div>
        <div className="ae-CodePanel-content">{renderHtml()}</div>
      </div>
    </>
  )
}
