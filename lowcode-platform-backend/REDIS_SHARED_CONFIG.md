# Redis共用配置说明

## 概述

lowcode-platform-backend现在已配置为与主系统backend共用Redis服务，避免了资源重复和配置复杂性。

## 🔄 配置变更

### 修改前（独立Redis）
- **Redis服务**: 独立的lowcode-redis容器
- **端口映射**: 26379:6379
- **密码**: soybean@123.
- **数据库**: 0

### 修改后（共用Redis）
- **Redis服务**: 共用主系统的redis容器
- **端口**: 26379 (主系统端口)
- **密码**: 123456 (与主系统一致)
- **数据库**: 6 (避免数据冲突)

## 📁 文件变更清单

### 1. 环境配置文件 (.env)
```diff
- REDIS_PASSWORD="soybean@123."
- REDIS_DB=0
+ REDIS_PASSWORD="123456"
+ REDIS_DB=6
```

### 2. Docker编排文件 (docker-compose.yml)
- ❌ 移除了 `lowcode-redis` 服务定义
- ❌ 移除了 `lowcode_redis_data` 数据卷
- ✅ 更新了后端服务的Redis环境变量
- ✅ 移除了对 `lowcode-redis` 的依赖

### 3. 启动脚本 (start-services.sh)
- ❌ 移除了 `start_redis()` 函数
- ✅ 添加了 `check_redis()` 函数检查主系统Redis
- ✅ 更新了端口检查逻辑
- ✅ 更新了服务状态显示

### 4. 验证脚本 (verify-config.sh)
- ✅ 更新了Redis配置验证
- ✅ 添加了主系统Redis连接测试
- ✅ 更新了端口检查逻辑

### 5. 文档文件
- ✅ 更新了 `DATABASE_CONFIG.md`
- ✅ 更新了 `README.md`
- ✅ 创建了 `REDIS_SHARED_CONFIG.md`

## 🚀 启动流程

### 1. 确保主系统Redis已启动
```bash
cd ../backend
docker-compose up -d redis
```

### 2. 验证Redis连接
```bash
redis-cli -h localhost -p 26379 -a "123456" ping
```

### 3. 启动lowcode服务
```bash
cd ../lowcode-platform-backend
./start-services.sh start
```

## 🔍 验证步骤

### 1. 运行配置验证
```bash
./verify-config.sh
```

### 2. 检查Redis连接
```bash
# 测试连接
redis-cli -h localhost -p 26379 -a "123456" ping

# 查看数据库列表
redis-cli -h localhost -p 26379 -a "123456" info keyspace

# 切换到lowcode数据库
redis-cli -h localhost -p 26379 -a "123456" -n 6
```

### 3. 检查服务状态
```bash
./start-services.sh status
```

## 📊 数据库分配

| 系统 | Redis数据库 | 用途 |
|------|-------------|------|
| 主系统backend | 1 | 主系统缓存 |
| 主系统backend | 5 | 配置默认值 |
| lowcode-platform | 6 | 低代码平台缓存 |

## ⚠️ 注意事项

### 1. 启动顺序
- 必须先启动主系统的Redis服务
- 再启动lowcode-platform-backend服务

### 2. 数据隔离
- 使用不同的数据库编号（6）避免数据冲突
- 建议使用不同的key前缀进一步隔离

### 3. 密码管理
- 两个系统现在使用相同的Redis密码（123456）
- 生产环境建议使用更强的密码

### 4. 监控和维护
- Redis日志统一在主系统中查看
- 性能监控需要考虑两个系统的共同使用

## 🛠️ 故障排除

### Redis连接失败
1. **检查主系统Redis状态**
   ```bash
   cd ../backend && docker-compose ps redis
   ```

2. **检查Redis日志**
   ```bash
   cd ../backend && docker-compose logs -f redis
   ```

3. **验证密码**
   ```bash
   redis-cli -h localhost -p 26379 -a "123456" ping
   ```

4. **检查端口占用**
   ```bash
   lsof -i :26379
   ```

### 数据冲突
1. **检查数据库使用情况**
   ```bash
   redis-cli -h localhost -p 26379 -a "123456" info keyspace
   ```

2. **清理特定数据库**
   ```bash
   redis-cli -h localhost -p 26379 -a "123456" -n 6 flushdb
   ```

### 性能问题
1. **监控Redis内存使用**
   ```bash
   redis-cli -h localhost -p 26379 -a "123456" info memory
   ```

2. **查看连接数**
   ```bash
   redis-cli -h localhost -p 26379 -a "123456" info clients
   ```

## 🔧 开发建议

### 1. Key命名规范
建议为lowcode-platform的key添加前缀：
```typescript
const LOWCODE_PREFIX = 'lowcode:';
const cacheKey = `${LOWCODE_PREFIX}entity:${entityId}`;
```

### 2. 连接池配置
```typescript
// Redis连接配置
const redisConfig = {
  host: 'localhost',
  port: 26379,
  password: '123456',
  db: 6,
  keyPrefix: 'lowcode:',
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
};
```

### 3. 错误处理
```typescript
try {
  await redis.set(key, value);
} catch (error) {
  console.error('Redis operation failed:', error);
  // 降级处理逻辑
}
```

## 📈 优势

1. **资源节约**: 减少了一个Redis容器的资源占用
2. **配置简化**: 统一的Redis服务管理
3. **维护便利**: 集中的日志和监控
4. **成本降低**: 减少了Docker容器数量

## 🔮 未来考虑

1. **生产环境**: 考虑使用Redis集群或哨兵模式
2. **数据备份**: 统一的Redis数据备份策略
3. **性能优化**: 根据使用情况调整Redis配置
4. **安全加固**: 启用TLS连接和更强的认证

---

**配置完成时间**: 2024-07-18  
**配置状态**: ✅ 已完成并验证  
**下次检查**: 建议定期验证Redis连接和性能
