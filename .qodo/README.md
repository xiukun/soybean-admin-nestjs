# SoybeanAdmin NestJS 低代码平台项目文档

本文档库包含了 SoybeanAdmin NestJS 低代码平台项目的完整技术文档，帮助开发团队理解项目架构、技术栈和各子服务功能。

## 📚 文档目录

### 🏗️ 架构文档
- [项目架构总览](./architecture-overview.md) - 项目整体架构设计和技术选型
- [服务架构图](./service-architecture.md) - 微服务架构图和服务间通信

### 🔧 子服务文档
- [Frontend 前端服务](./services/frontend-service.md) - Vue3 管理后台前端
- [Backend 主后端服务](./services/backend-service.md) - NestJS 主要业务后端
- [Lowcode Designer 设计器](./services/lowcode-designer-service.md) - 低代码可视化设计器
- [Lowcode Platform Backend](./services/lowcode-platform-backend-service.md) - 低代码平台核心后端
- [Amis Lowcode Backend](./services/amis-lowcode-backend-service.md) - Amis 低代码业务后端

### 🚀 部署文档
- [Docker 部署指南](./deployment/docker-deployment.md) - Docker 容器化部署说明
- [开发环境搭建](./deployment/development-setup.md) - 本地开发环境配置
- [生产环境部署](./deployment/production-deployment.md) - 生产环境部署指南

### 📖 开发文档
- [API 接口文档](./api/api-documentation.md) - 各服务 API 接口说明
- [数据库设计](./database/database-design.md) - 数据库表结构和关系设计
- [代码生成指南](./development/code-generation-guide.md) - 低代码平台代码生成说明

### 🛠️ 运维文档
- [项目维护指南](./maintenance/maintenance-guide.md) - 项目维护和更新指南
- [监控和日志](./maintenance/monitoring-logging.md) - 系统监控和日志管理
- [故障排查](./maintenance/troubleshooting.md) - 常见问题和解决方案

## 🎯 快速开始

1. **了解项目架构**: 从 [项目架构总览](./architecture-overview.md) 开始
2. **搭建开发环境**: 参考 [开发环境搭建](./deployment/development-setup.md)
3. **部署项目**: 使用 [Docker 部署指南](./deployment/docker-deployment.md)
4. **开发指南**: 查看各子服务的详细文档

## 📝 文档更新

本文档库会随着项目的发展持续更新，建议定期查看最新版本。

---

**项目版本**: v1.0.0  
**文档更新时间**: 2024年12月  
**维护团队**: SoybeanAdmin 开发团队