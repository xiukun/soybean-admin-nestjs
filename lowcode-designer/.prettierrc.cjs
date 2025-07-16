module.exports = {
  printWidth: 100, // 一行最多100字符
  tabWidth: 2, // 使用 2 个空格缩进
  useTabs: false,
  semi: false,
  singleQuote: true, // 单引号
  jsxSingleQuote: false, // jsx 不使用单引号，而使用双引号
  trailingComma: 'all', // 末尾使用逗号
  bracketSpacing: true, // 大括号内的首尾需要空格 { foo: bar }
  arrowParens: 'avoid', // 箭头函数，只有一个参数的时候，不需要括号
  rangeStart: 0, // 每个文件格式化的范围是文件的全部内容
  rangeEnd: Infinity,
  requirePragma: false, // 不需要写文件开头的 @prettier
  insertPragma: false, // 不需要自动在文件开头插入 @prettier
  proseWrap: 'preserve', // 使用默认的折行标准
  htmlWhitespaceSensitivity: 'css', // 根据显示样式决定 html 要不要折行
  vueIndentScriptAndStyle: false, // 不在 Vue 文件中缩进脚本和样式标签
  embeddedLanguageFormatting: 'auto', //如果 Prettier 可以自动识别嵌入代码，请格式化它。
}
