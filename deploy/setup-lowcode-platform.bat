@echo off
setlocal enabledelayedexpansion

REM 低代码平台设置脚本 (Windows版本)
REM Low-code Platform Setup Script (Windows Version)

echo ==================================================
echo 🚀 低代码平台设置脚本
echo    Low-code Platform Setup Script
echo ==================================================
echo.

REM 检查环境变量
if "%DATABASE_URL%"=="" (
    echo [ERROR] DATABASE_URL 环境变量未设置
    echo 请设置 DATABASE_URL，例如：
    echo set DATABASE_URL=postgresql://username:password@localhost:5432/database
    pause
    exit /b 1
)

echo [INFO] 环境变量检查完成

REM 检查 psql 命令
where psql >nul 2>&1
if errorlevel 1 (
    echo [ERROR] psql 命令未找到，请安装 PostgreSQL 客户端
    pause
    exit /b 1
)

echo [INFO] PostgreSQL 客户端检查完成

REM 检查数据库连接
psql "%DATABASE_URL%" -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 无法连接到数据库，请检查 DATABASE_URL
    pause
    exit /b 1
)

echo [SUCCESS] 数据库连接正常

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
set POSTGRES_DIR=%SCRIPT_DIR%postgres

REM 检查 postgres 目录是否存在
if not exist "%POSTGRES_DIR%" (
    echo [ERROR] postgres 目录不存在: %POSTGRES_DIR%
    pause
    exit /b 1
)

echo [INFO] 开始低代码平台安装...

REM SQL 文件执行顺序
set SQL_FILES[0]=00_init_schemas.sql:初始化数据库 Schema
set SQL_FILES[1]=01_create_table.sql:创建基础表结构
set SQL_FILES[2]=04_sys_menu.sql:创建基础菜单数据
set SQL_FILES[3]=10_lowcode_platform_tables.sql:创建低代码平台表结构
set SQL_FILES[4]=17_prisma_schema_updates.sql:更新数据库结构（确保兼容性）
set SQL_FILES[5]=18_project_deployment_features.sql:添加项目部署功能
set SQL_FILES[6]=19_update_project_deployment_data.sql:更新项目部署数据
set SQL_FILES[7]=16_lowcode_platform_pages.sql:创建低代码页面配置
set SQL_FILES[8]=14_code_generation_menus.sql:创建低代码平台菜单
set SQL_FILES[9]=20_deployment_verification.sql:验证部署功能

set FAILED_COUNT=0

REM 执行 SQL 文件
for /L %%i in (0,1,9) do (
    set SQL_ENTRY=!SQL_FILES[%%i]!
    for /f "tokens=1,2 delims=:" %%a in ("!SQL_ENTRY!") do (
        set FILENAME=%%a
        set DESCRIPTION=%%b
        set FILE_PATH=%POSTGRES_DIR%\!FILENAME!
        
        if exist "!FILE_PATH!" (
            echo [INFO] 执行: !DESCRIPTION!
            echo [INFO] 文件: !FILE_PATH!
            
            psql "%DATABASE_URL%" -f "!FILE_PATH!"
            if errorlevel 1 (
                echo [ERROR] ❌ !DESCRIPTION! 失败
                set /a FAILED_COUNT+=1
            ) else (
                echo [SUCCESS] ✅ !DESCRIPTION! 完成
            )
            
            REM 添加短暂延迟
            timeout /t 1 /nobreak >nul
        ) else (
            echo [WARNING] 文件不存在: !FILE_PATH!
            set /a FAILED_COUNT+=1
        )
    )
)

REM 检查是否有失败的文件
if !FAILED_COUNT! gtr 0 (
    echo [ERROR] 有 !FAILED_COUNT! 个文件执行失败
    pause
    exit /b 1
)

echo [SUCCESS] 🎉 低代码平台安装完成！

REM 验证安装
echo [INFO] 验证安装结果...

REM 检查低代码平台菜单
for /f %%a in ('psql "%DATABASE_URL%" -t -c "SELECT COUNT(*) FROM backend.sys_menu WHERE route_name LIKE 'lowcode%%';"') do set MENU_COUNT=%%a
set MENU_COUNT=!MENU_COUNT: =!

if !MENU_COUNT! gtr 0 (
    echo [SUCCESS] ✅ 发现 !MENU_COUNT! 个低代码平台菜单项
) else (
    echo [ERROR] ❌ 未发现低代码平台菜单项
    pause
    exit /b 1
)

REM 检查低代码页面
for /f %%a in ('psql "%DATABASE_URL%" -t -c "SELECT COUNT(*) FROM backend.sys_lowcode_page WHERE code LIKE 'lowcode%%';"') do set PAGE_COUNT=%%a
set PAGE_COUNT=!PAGE_COUNT: =!

if !PAGE_COUNT! gtr 0 (
    echo [SUCCESS] ✅ 发现 !PAGE_COUNT! 个低代码页面配置
) else (
    echo [ERROR] ❌ 未发现低代码页面配置
    pause
    exit /b 1
)

REM 检查权限配置
for /f %%a in ('psql "%DATABASE_URL%" -t -c "SELECT COUNT(*) FROM backend.sys_role_menu rm JOIN backend.sys_menu m ON rm.menu_id = m.id WHERE m.route_name LIKE 'lowcode%%';"') do set PERMISSION_COUNT=%%a
set PERMISSION_COUNT=!PERMISSION_COUNT: =!

if !PERMISSION_COUNT! gtr 0 (
    echo [SUCCESS] ✅ 发现 !PERMISSION_COUNT! 个权限配置
) else (
    echo [ERROR] ❌ 未发现权限配置
    pause
    exit /b 1
)

echo [SUCCESS] 🎯 安装验证通过！

REM 显示安装后信息
echo.
echo [INFO] 安装后信息:
echo.
echo 📋 低代码平台功能模块:
echo    1. 项目管理 - 创建项目：定义项目基本信息和配置
echo    2. 实体管理 - 设计实体：创建业务实体和数据模型
echo    3. 字段管理 - 管理字段：定义字段类型、验证规则、UI配置
echo    4. 关系管理 - 配置关系：设置实体间的关联关系
echo    5. 查询管理 - 编写查询：创建复杂的数据查询逻辑
echo    6. API配置 - 配置API：定义RESTful API接口
echo    7. API测试 - 测试API：在线测试API功能
echo    8. 模板管理 - 管理模板：维护代码生成模板
echo    9. 代码生成器 - 生成代码：一键生成NestJS业务服务
echo    10. 目标项目管理 - 管理代码生成的目标项目
echo.
echo 🔐 权限配置:
echo    - 超级管理员角色已自动分配所有权限
echo    - 如需为其他角色分配权限，请参考 README_LOWCODE_SETUP.md
echo.
echo 📚 文档:
echo    - 详细设置指南: deploy\postgres\README_LOWCODE_SETUP.md
echo    - AMIS 文档: https://aisuda.bce.baidu.com/amis/zh-CN/docs/index
echo.
echo 🚀 下一步:
echo    1. 重启后端服务以加载新的菜单配置
echo    2. 登录系统查看低代码平台菜单
echo    3. 开始使用低代码平台功能
echo.
echo [SUCCESS] 🎉 低代码平台设置完成！
echo ==================================================

pause
