import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// 解决引用amis  monaco web worker error ,原因未知，在低版本里可以避免，最新版本会报错
self.MonacoEnvironment = {
  getWorker(_: any, label: any) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    // if (label === 'html' || label === 'tsx' || label === 'handlebars') {
    //   return new htmlWorker()
    // }
    if (label === 'javascript' || label === 'typescript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
}
