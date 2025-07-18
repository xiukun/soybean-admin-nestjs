# 路径别名验证报告

生成时间: 2025/7/18 05:28:50

## 📊 别名使用统计

| 别名 | 使用次数 | 状态 |
|------|----------|------|
| `@` | 424 | ✅ 使用中 |
| `@lib` | 53 | ✅ 使用中 |
| `@entity` | 47 | ✅ 使用中 |
| `@project` | 35 | ✅ 使用中 |
| `@src` | 33 | ✅ 使用中 |
| `@api` | 19 | ✅ 使用中 |
| `@prisma` | 12 | ✅ 使用中 |
| `@api-context` | 11 | ✅ 使用中 |
| `@test` | 8 | ✅ 使用中 |
| `@shared` | 6 | ✅ 使用中 |
| `@infra` | 5 | ✅ 使用中 |
| `@codegen` | 5 | ✅ 使用中 |
| `@code-generation` | 5 | ✅ 使用中 |
| `@decorators` | 4 | ✅ 使用中 |
| `@dto` | 2 | ✅ 使用中 |
| `@middleware` | 1 | ✅ 使用中 |
| `@interceptors` | 1 | ✅ 使用中 |
| `@app` | 0 | ⚠️ 未使用 |
| `@views` | 0 | ⚠️ 未使用 |
| `@resources` | 0 | ⚠️ 未使用 |
| `@config` | 0 | ⚠️ 未使用 |
| `@utils` | 0 | ⚠️ 未使用 |
| `@controllers` | 0 | ⚠️ 未使用 |
| `@services` | 0 | ⚠️ 未使用 |
| `@test-utils` | 0 | ⚠️ 未使用 |

## 🔍 目录验证结果

✅ 所有路径别名都指向有效目录

## ⚠️ 需要优化的导入路径

✅ 未发现复杂相对路径

## 🛠️ 建议

1. **未使用的别名**: 考虑移除未使用的路径别名以简化配置
2. **复杂相对路径**: 运行 `npm run update-imports` 自动转换为路径别名
3. **循环依赖**: 定期运行 `npx madge --circular --extensions ts src/` 检查
4. **配置同步**: 确保 Jest 配置与 tsconfig.json 保持同步

## 📝 相关命令

```bash
# 自动更新导入路径
npm run update-imports

# 检查 TypeScript 编译
npm run check-imports

# 检测循环依赖
npx madge --circular --extensions ts src/

# 重新验证路径别名
npm run validate-aliases
```
