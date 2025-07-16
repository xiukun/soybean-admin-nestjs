import { ConfigProvider } from 'antd'
import ReactDOM from 'react-dom/client'
import App from './App'

import './utils/initialize'
import '@fortawesome/fontawesome-free/css/all.css'
import 'font-awesome/css/font-awesome.css'

import 'amis/lib/themes/default.css'
import 'amis/lib/helper.css'
import 'amis-editor-core/lib/style.css'
import 'amis/sdk/iconfont.css'
// import 'amis-ui/lib/themes/cxd.css'
import 'amis-ui/lib/themes/antd.css'

import './styles/main.css'
import './styles/amis.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConfigProvider><App /></ConfigProvider>
)

