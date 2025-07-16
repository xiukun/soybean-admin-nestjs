import { memo, useEffect, useState } from 'react'
import { Icon } from 'amis'
import { BuildPanelEventContext, BasePlugin, BasicPanelItem } from 'amis-editor'
import { useAmisStoreContext } from '@/store/amis-store'
import { Button, Divider, List, Skeleton } from 'antd'
import InfiniteScroll from 'react-infinite-scroll-component'
import agHttp from '@/utils/http'
import to from 'await-to-js'
import dayjs from 'dayjs'
import { amisPageFindHistoryListById } from '@/api/amis'

const baseTitle = '历史版本'

/**
 * 左侧 功能页面版本管理
 */
export default class LeftVersionsManage extends BasePlugin {
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
      key: 'VersionsManage',
      icon: '',
      title: (
        <span className="editor-tab-icon plugin-left-menu-icon" editor-tooltip={baseTitle}>
          <Icon icon="fa fa-clock-o" />
        </span>
      ),
      component: memo(VersionsManage),
      position: 'left',
      order: 5200,
    })
  }
}

function VersionsManage(_props: any) {
  const [renderKey, setRenderKey] = useState(0)
  // 当需要重新渲染子组件时，调用setRenderKey
  const forceChildRender = () => {
    setRenderKey(currentKey => currentKey + 1)
  }
  return (
    <>
      <div className="ae-CodePanel">
        <div className="panel-header">
          <span>
            {baseTitle}
            &nbsp;&nbsp;
            <span
              className="plugin-left-menu-icon pl-1 cursor-pointer"
              title="刷新"
              editor-tooltip="刷新"
              onClick={forceChildRender}
            >
              <i className="fa fa-refresh"></i>
            </span>
          </span>
        </div>
        <div className="ae-CodePanel-content ml-1">
          <App key={renderKey} />
        </div>
      </div>
    </>
  )
}

const App: React.FC = () => {
  const useCtx = useAmisStoreContext()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true) // 控制列表是否加载完成，默认true能下拉刷新
  let perPage = 15 // 每页10条数据

  const loadMoreData = () => {
    if (loading) {
      return
    }
    setPage(page + 1)
    setLoading(true)
    amisPageFindHistoryListById({
      mainId: window.AG_NEPTUNE_LOWCODE_PAGE_ID,
      page,
      perPage,
    })
      .then(body => {
        if (body.data.options && body.data.options.length < perPage) {
          setHasMore(false)
        }
        setData([...data, ...body.data.options])
        setLoading(false)
      })
      .catch(() => {
        setPage(page - 1)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadMoreData()
  }, [])

  /**
   * 根据ID获取历史页面的schema JSON
   * @param id
   */
  const getHistorySchemaById = async (id: string) => {
    const [err, body] = await to<any>(agHttp.post('/system/amisPage/findByPageId', { id }))
    if (err) return
    if (body.data) {
      useCtx.onChange(body.data.content ? JSON.parse(body.data.content) : undefined)
    }
  }

  // 格式化日期时间
  const getDateTime = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  return (
    <div
      id="scrollableDiv"
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '0 2px',
      }}
    >
      <InfiniteScroll
        dataLength={data.length}
        next={loadMoreData}
        hasMore={hasMore}
        loader={<Skeleton paragraph={{ rows: 2 }} active />}
        endMessage={<Divider plain>没有更多内容了</Divider>}
        scrollableTarget="scrollableDiv"
      >
        <List
          className="demo-loadmore-list"
          itemLayout="horizontal"
          dataSource={data}
          renderItem={item => (
            <List.Item key={getDateTime(item.createdOn)}>
              <List.Item.Meta
                title={getDateTime(item.createdOn)}
                description={`${item.menuName} 版本:${item.versionNum} 修改人：${item.createdBy}`}
              />
              <div className="pt-5">
                <Button type="link" block onClick={() => getHistorySchemaById(item.id)}>
                  替换
                </Button>
              </div>
            </List.Item>
          )}
        />
      </InfiniteScroll>
    </div>
  )
}
