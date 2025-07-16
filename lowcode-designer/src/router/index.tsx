import { lazy } from 'react'
const HtmlEditor = lazy(() => import('@/pages/html'))
const FLowEditor = lazy(() => import('@/pages/flow'))
const PluginEditor = lazy(() => import('@/pages/plugin'))
const router = [
  {
    path: '/',
    component: HtmlEditor,
    name: '页面设计器',
  },
  {
    path: '/flow',
    component: FLowEditor,
    name: '工作流设计器',
  },
  {
    path: '/plugin',
    component: PluginEditor,
    name: '组件设计器',
  },
]

export default router
