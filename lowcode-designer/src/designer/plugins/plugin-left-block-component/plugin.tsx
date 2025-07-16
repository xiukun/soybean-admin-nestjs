import { Icon, InputBox } from 'amis'
import React from 'react'
import { BasePlugin, BasicPanelItem } from 'amis-editor-core'
import cx from 'classnames'
import uuid from '@/utils/uuid'
import agHttp from '@/utils/http'
import { isString } from 'lodash'
import { matchSorter } from 'match-sorter'
// import { amisPageFindDetail } from '@/api/amis'

const curTagKey = 'groupName'
const title = '业务组件'

/**
 * 获取组件去掉头和尾的中括号
 * @param str  字符串
 * @returns 字符串
 */
function trimBrackets(str: string): string {
  return str?.replace(/^\[|\]$/g, '')
}

export default class LeftBlockComponent extends BasePlugin {
  static scene = ['layout']
  order = -9999

  buildEditorPanel(_context: any, panels: Array<BasicPanelItem>) {
    panels.push({
      key: 'blockComponentTpl',
      icon: '',
      title: (
        <span className="editor-tab-icon plugin-left-menu-icon" editor-tooltip={title}>
          <Icon icon="fa fa-diamond" />
        </span>
      ),
      component: RenderersPanel,
      position: 'left',
      order: 5200,
    })
  }
}

class RenderersPanel extends React.PureComponent<any, any> {
  // 用于记录组件分类面板的折叠状态
  curCollapseFolded: {
    [propName: string]: boolean
  } = {}
  constructor(props: any) {
    super(props)
    this.state = {
      toggleCollapseFolderStatus: false, // 用于触发重新渲染组件面板的
      curKeyword: '', // 搜索关键字
      resultData: [],
      resultTags: [],
      searchResult: [],
      searchResultByTag: {},
    }
  }

  componentDidMount(): void {
    this.getData()
  }

  getData = () => {
    // 获取分类信息
    // unitType: 0 组件类型
    agHttp
      .post('/system/CAmisUnit/findByAmis', {
        unitType: 0,
        isClosed: 0,
      })
      .then(async (res: any) => {
        const data = res.data.options

        const curResultTagsObj = this.getResultTags(data)
        this.setState({
          resultData: data,
          resultTags: curResultTagsObj.curResultTags,
          searchResultByTag: curResultTagsObj.curResultByTag,
        })
      })
  }

  handleRegionFilterClick(e: React.MouseEvent) {
    let region = e.currentTarget.getAttribute('data-value')!

    const { store, manager } = this.props
    region = region === store.subRendererRegion ? '' : region
    manager.switchToRegion(region)
  }

  handleDragStart(e: React.DragEvent, _label: string) {
    const current = e.currentTarget
    const id = current.getAttribute('data-id')!

    e.dataTransfer.setData(`dnd-dom/[data-id="${id}"]`, '')
    /*
    // 增加默认拖拽过程中元素
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setDragImage(
      this.props.manager?.dnd?.createDragImage(_label),
      0,
      0
    );
    */
  }

  changeCollapseFoldStatus(tagKey: string, event: any) {
    this.curCollapseFolded[tagKey] = !this.curCollapseFolded[tagKey]
    this.setState({
      toggleCollapseFolderStatus: !this.state.toggleCollapseFolderStatus,
    })
    event.preventDefault()
    event.stopPropagation()
  }

  render() {
    const { curKeyword } = this.state
    return (
      <div className="ae-CodePanel">
        <div className="panel-header">
          <span>
            {title}
            &nbsp;&nbsp;
            <span
              className="plugin-left-menu-icon pl-1 cursor-pointer"
              title="刷新"
              editor-tooltip="刷新"
              onClick={() => this.getData()}
            >
              <i className="fa fa-refresh"></i>
            </span>
          </span>
        </div>
        <div className="editor-InputSearch-panel">
          <InputBox
            className="editor-InputSearch"
            value={curKeyword}
            onChange={this.updateCurKeyword}
            placeholder={'输入关键字查询'}
            clearable={true}
          ></InputBox>
        </div>
        <div className="ae-CodePanel-content">{this.renderCollapseHtml()}</div>
      </div>
    )
  }
  renderContentHtml(item: any[]) {
    return (
      <div key={uuid()} className="flex flex-wrap cursor-pointer">
        {item.length
          ? item.map((item: any) => {
              const key = item.id
              return (
                <div
                  key={key}
                  title={item.unitName}
                  className="ae-RendererList-item"
                  draggable
                  data-id={key}
                  data-dnd-type="subrenderer"
                  data-dnd-id={key}
                  data-dnd-data={trimBrackets(item.pageJson)}
                  onDragStart={(e: React.DragEvent) => this.handleDragStart(e, item.label)}
                >
                  <div
                    className="icon-box"
                    data-dnd-id={key}
                    title={`点击添加「${item.unitName}」`}
                  >
                    <i className={item.unitIcon}></i>
                  </div>
                  <div className="ae-RendererInfo" data-dnd-id={key}>
                    {item.unitName}
                  </div>
                </div>
              )
            })
          : null}
      </div>
    )
  }

  renderCollapseHtml() {
    const { searchResultByTag } = this.state
    const keys = Object.keys(searchResultByTag)
    return (
      <div className="ae-RendererList-groupWrap hoverShowScrollBar">
        {keys.map(tag => {
          const items = (searchResultByTag as any)[tag]

          if (!items || !items.length) {
            return null
          }

          return (
            <React.Fragment key={uuid()}>
              <div
                key={`${tag}-head`}
                className={'ae-RendererList-head collapse-header'}
                onClick={(event: any) => {
                  this.changeCollapseFoldStatus(tag, event)
                }}
              >
                {tag}
                <div
                  className={cx('expander-icon', {
                    'is-folded': !!this.curCollapseFolded[tag],
                  })}
                  title={this.curCollapseFolded[tag] ? '点击展开' : '点击折叠'}
                >
                  <Icon icon="right-arrow-bold" />
                </div>
              </div>
              <div
                key={`${tag}-content`}
                className={cx('ae-RendererList-group collapse-content', {
                  'is-folded': !!this.curCollapseFolded[tag],
                })}
              >
                {this.renderContentHtml(items)}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  /**
   * 从搜索数据中获取分类信息，并按分类存放搜索数据，方便后续通过分类直接获取搜索数据
   */
  getResultTags = (allResult: Array<any>) => {
    let curResultTags: Array<string> = []
    let curResultByTag: {
      [propName: string]: Array<any>
    } = {}
    allResult.forEach(item => {
      if (!isString(item) && item[curTagKey]) {
        const tags = Array.isArray(item[curTagKey])
          ? item[curTagKey].concat()
          : item[curTagKey]
            ? [item[curTagKey]]
            : ['其他']
        tags.forEach((tag: string) => {
          if (curResultTags.indexOf(tag) < 0) {
            curResultTags.push(tag)
          }
          if (curResultByTag[tag]) {
            curResultByTag[tag].push(item)
          } else {
            curResultByTag[tag] = []
            curResultByTag[tag].push(item)
          }
        })
      }
    })
    return {
      curResultTags,
      curResultByTag,
    }
  }

  updateCurKeyword = (keywords: string) => {
    let curKeyword = keywords
    curKeyword = curKeyword ? curKeyword.trim() : curKeyword
    this.setState(
      {
        curKeyword: curKeyword,
      },
      () => {
        this.groupedResultByKeyword(curKeyword)
        if (this.props.immediateChange) {
          this.props.onChange(curKeyword)
        }
      },
    )
  }

  /**
   * 根据关键字过滤数据，按分组存放
   */
  groupedResultByKeyword = (keywords: string = '') => {
    const { resultData } = this.state
    let curSearchResult: any[] = []
    let curSearchResultByTag: {
      [propName: string]: any[]
    } = {}

    if (resultData.length && isString(resultData[0])) {
      matchSorter(resultData, keywords).forEach(item => {
        // 兼容字符串类型
        curSearchResult.push(item)
      })
    } else {
      const searchMap = new Map<string, any>()
      matchSorter(resultData, keywords, {
        keys: ['groupName', 'unitName', 'remark'],
      }).forEach((item: any) => {
        searchMap.set(item.id, item)
      })

      resultData.forEach((item: any) => {
        if (searchMap.has(item.id)) {
          if (item[curTagKey]) {
            const tags = Array.isArray(item[curTagKey])
              ? item[curTagKey].concat()
              : item[curTagKey]
                ? [item[curTagKey]]
                : ['其他']
            tags.forEach((tag: string) => {
              curSearchResultByTag[tag] = curSearchResultByTag[tag] || []
              curSearchResultByTag[tag].push(item)
            })
          } else {
            curSearchResult.push(item)
          }
        }
      })
    }

    // 更新当前搜索结果数据（备注: 附带重置功能）
    this.setState({
      searchResult: curSearchResult,
      searchResultByTag: curSearchResultByTag,
    })
  }
}
