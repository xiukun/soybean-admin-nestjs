/**
 * 字节转MB
 * @param bytes 文件大小
 * @returns
 */
const bytesToMB = (bytes: number) => bytes / 1048576 || 0

/**
 * 替换网址URL参数值
 * @param url
 * @param paramName
 * @param paramValue
 * @returns
 */
const replaceUrlParam = (url: string, paramName: string, paramValue: string): string => {
  const urlObj = new URL(url)
  urlObj.searchParams.set(paramName, paramValue)
  return urlObj.toString()
}

/**
 * 数组列表转树形结构
 * @param list 一维数组列表
 * @param parentName 父元素名，默认parentId
 * @param childName 子元素名，默认children
 * @returns 树形结构数组
 */
const listToTree = (list: any[], parentName = 'parentId', childName = 'children') => {
  const res = []
  const map = list.reduce((res, v) => ((res[v.id] = v), res), {})

  for (const item of list) {
    if (item[parentName] === null || item[parentName] === '') {
      res.push(item)
      continue
    }
    if (item[parentName] in map) {
      const parent = map[item[parentName]]
      parent[childName] = parent[childName] || []
      parent[childName].push(item)
    }
  }
  return res
}

/**
 * 树形结构转扁平数组
 * @param data 树形结构数组
 * @param childName 子元素名，默认children
 * @returns 扁平数组
 */
const treeToList = (data: any[], childName = 'children'): any[] => {
  if (!Array.isArray(data)) {
    return []
  }
  return data?.reduce((prev, cur) => prev.concat([cur], treeToList(cur[childName] || [])), [])
}

/**
 * 查找节点路径 demo: treeFindPath(tree, node => node.id === '2-1')
 * @param tree 树形结构数组
 * @param func 查找条件函数
 * @param path 路径数组
 * @returns 节点路径
 */
const treeFindPath = (tree: any, func: (arg0: any) => any, path: any[] = []): any[] => {
  if (!tree) return []
  for (const data of tree) {
    path.push(data)
    if (func(data)) return path
    if (data.children) {
      const findChildren = treeFindPath(data.children, func, path)
      if (findChildren.length) return findChildren
    }
    path.pop()
  }
  return []
}

/**
 * 将函数转换为字符串,返回方法体内的代码内容
 * @param func 函数
 * @returns 函数体内容
 */
function functionToString(func: Function) {
  // 将函数转换为字符串
  let str = func.toString()

  // 使用正则表达式匹配函数体
  let match = str.match(/(?<=\{)(.|\n)*(?=\})/)

  if (match) {
    // 如果匹配成功，返回函数体内容并去除首尾空白
    return match[0].trim()
  } else {
    // 如果没有匹配到函数体（例如箭头函数），返回原始字符串
    return str
  }
}

// // 测试函数
// function testFunction(a, b) {
//   let result = a + b
//   console.log(`The sum is: ${result}`)
//   return result
// }

// // 使用我们的函数
// let result = functionToString(testFunction)

export { bytesToMB, replaceUrlParam, listToTree, treeToList, treeFindPath, functionToString }
