import { memo, useEffect, useState } from 'react'
import { Icon } from 'amis'
import { BuildPanelEventContext, BasePlugin, BasicPanelItem } from 'amis-editor'
import useAmisStore, { useAmisStoreContext } from '@/store/amis-store'
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
  const [hasMore, setHasMore] = useState<boolean>(true)
  const perPage = 15 // 每页15条数据

  const {lowcodePageId} = useAmisStore()
  
  // 初始化或lowcodePageId变化时重新加载数据
  useEffect(() => {
    // 重置状态
    setData([])
    setPage(1)
    setHasMore(true)
    
    // 加载数据
    loadData()
  }, [lowcodePageId])
  
  // 加载数据函数
  const loadData = () => {
    if (loading || !lowcodePageId) {
      return
    }
    
    setLoading(true)
    
    amisPageFindHistoryListById({
      mainId: lowcodePageId,
      pageNum: page,
      pageSize: perPage,
    })
      .then(body => {
        const newData = body.data?.options || []
        const total = body.data?.total || 0
        
        // 判断是否还有更多数据
        if (data.length + newData.length >= total) {
          setHasMore(false)
        }
        
        // 追加数据
        setData(prevData => [...prevData, ...newData])
        setPage(prevPage => prevPage + 1)
        setLoading(false)
      })
      .catch((error) => {
        console.error('加载历史版本失败:', error)
        setLoading(false)
      })
  }
  
  // 无限滚动加载更多数据
  const loadMoreData = () => {
    if (!hasMore || !lowcodePageId) {
      return
    }
    loadData()
  }

  /**
   * 根据版本ID获取历史页面的schema JSON并替换当前页面
   * @param versionId 版本ID
   */
  const replaceWithHistoryVersion = async (versionId: string) => {
    try {
      
      const [err, body] = await to<any>(
        agHttp.get(`/v1/lowcode/pages/${lowcodePageId}/versions/${versionId}`)
      )
      
      if (err) {
        console.error('获取历史版本失败:', err)
        return
      }
      
      if (body.data?.schema) {
        // 替换当前设计器的schema
        useCtx.onChange(body.data.schema)
        console.log('已替换为历史版本:', versionId)
      }
    } catch (error) {
      console.error('替换历史版本时出错:', error)
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
            <List.Item key={item.id}>
              <List.Item.Meta
                title={getDateTime(item.createdAt)}
                description={
                  <>
                    <div>{item.menuPage}</div>
                    <div>版本: {item.pageVersion}</div>
                    <div>修改人: {item.creator}</div>
                    {item.changelog && <div className="text-gray-500 text-xs mt-1">{item.changelog}</div>}
                  </>
                }
              />
              <div className="pt-5">
                <Button 
                  type="link" 
                  block 
                  onClick={() => replaceWithHistoryVersion(item.id)}
                  title="将当前页面替换为此历史版本"
                >
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
