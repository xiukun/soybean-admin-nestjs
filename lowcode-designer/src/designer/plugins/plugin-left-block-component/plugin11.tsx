import { Icon } from 'amis'

import { BuildPanelEventContext, BasePlugin, BasicPanelItem } from 'amis-editor'
import { memo } from 'react'
import bizList from './data.json'

const title = '业务组件'
/**
 * 左侧 区块组件 业务组件
 */
export default class LeftBlockComponent extends BasePlugin {
  static scene = ['layout']
  order = -9999

  buildEditorPanel(_context: BuildPanelEventContext, panels: Array<BasicPanelItem>) {
    // const store = this.manager.store

    // if (store && context.selections.length) {
    //   const { changeLeftPanelOpenStatus, changeLeftPanelKey } = store
    //   changeLeftPanelOpenStatus(true)
    //   changeLeftPanelKey('blockComponentTpl')
    // }
    panels.push({
      key: 'blockComponentTpl',
      icon: '', 
      title: (
        <span className="plugin-left-menu-icon" editor-tooltip={title}>
          <Icon icon="fa fa-diamond" />
        </span>
      ),
      component: memo(BlockComponent),
      position: 'left',
      order: 5200,
    })
  }
}

function BlockComponent(props: any) {
  const { onChange } = props
  const renderHtml = () => {
    return (
      <>
        {bizList.map((item: any) => {
          return (
            <div key={item.id} className="flex flex-col">
              <div className="flex items-center m-2 cursor-pointer">
                <i className={item.icon}></i>
                <div className="h-6" onClick={() => onChange(item.value)}>
                  {item.label}
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  }
  return (
    <>
      <div className="ae-CodePanel">
        <div className="panel-header">{title}</div>
        <div className="ae-CodePanel-content">{renderHtml()}</div>
      </div>
    </>
  )
}
