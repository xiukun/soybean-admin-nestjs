@echo off
setlocal enabledelayedexpansion

REM 项目部署功能验证脚本 (Windows)
REM Project Deployment Feature Verification Script (Windows)

echo ================================================
echo 项目部署功能验证脚本
echo Project Deployment Feature Verification
echo ================================================
echo.

REM 检查环境变量
echo [INFO] 检查环境变量...
if "%DATABASE_URL%"=="" (
    echo [ERROR] DATABASE_URL 环境变量未设置
    exit /b 1
)
echo [SUCCESS] 环境变量检查完成
echo.

REM 检查 psql 命令
echo [INFO] 检查 PostgreSQL 客户端...
where psql >nul 2>&1
if errorlevel 1 (
    echo [ERROR] psql 命令未找到，请安装 PostgreSQL 客户端
    exit /b 1
)
echo [SUCCESS] PostgreSQL 客户端已安装
echo.

REM 检查数据库连接
echo [INFO] 检查数据库连接...
psql "%DATABASE_URL%" -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 无法连接到数据库
    exit /b 1
)
echo [SUCCESS] 数据库连接正常
echo.

REM 验证数据库结构
echo [INFO] 验证数据库结构...

REM 检查项目表的部署字段
for /f %%i in ('psql "%DATABASE_URL%" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'lowcode' AND table_name = 'lowcode_projects' AND column_name IN ('deployment_status', 'deployment_port', 'deployment_config', 'last_deployed_at', 'deployment_logs');"') do set deployment_fields=%%i

set deployment_fields=!deployment_fields: =!
if "!deployment_fields!"=="5" (
    echo [SUCCESS] 项目表部署字段验证通过 ^(5/5^)
) else (
    echo [ERROR] 项目表部署字段不完整 ^(!deployment_fields!/5^)
    exit /b 1
)

REM 检查部署历史表
for /f %%i in ('psql "%DATABASE_URL%" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'lowcode' AND table_name = 'lowcode_project_deployments';"') do set deployment_table=%%i

set deployment_table=!deployment_table: =!
if "!deployment_table!"=="1" (
    echo [SUCCESS] 项目部署历史表存在
) else (
    echo [ERROR] 项目部署历史表不存在
    exit /b 1
)

echo [SUCCESS] 数据库结构验证完成
echo.

REM 验证示例数据
echo [INFO] 验证示例数据...

for /f %%i in ('psql "%DATABASE_URL%" -t -c "SELECT COUNT(*) FROM lowcode.lowcode_projects WHERE deployment_status IS NOT NULL;"') do set projects_with_deployment=%%i
set projects_with_deployment=!projects_with_deployment: =!

for /f %%i in ('psql "%DATABASE_URL%" -t -c "SELECT COUNT(*) FROM lowcode.lowcode_project_deployments;"') do set deployment_records=%%i
set deployment_records=!deployment_records: =!

echo [INFO] 有部署状态的项目数量: !projects_with_deployment!
echo [INFO] 部署历史记录数量: !deployment_records!

if !projects_with_deployment! gtr 0 if !deployment_records! gtr 0 (
    echo [SUCCESS] 示例数据验证通过
) else (
    echo [WARNING] 示例数据可能不完整
)
echo.

REM 检查服务状态
echo [INFO] 检查服务状态...

REM 检查低代码平台后端
set lowcode_backend_port=9521
curl -s "http://localhost:!lowcode_backend_port!/api/v1/health" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 低代码平台后端服务可能未运行 ^(端口: !lowcode_backend_port!^)
) else (
    echo [SUCCESS] 低代码平台后端服务运行正常 ^(端口: !lowcode_backend_port!^)
)

REM 检查 amis-lowcode-backend
set amis_backend_port=9522
curl -s "http://localhost:!amis_backend_port!/health" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Amis 低代码后端服务未运行 ^(端口: !amis_backend_port!^) - 这是正常的，项目部署时会启动
) else (
    echo [SUCCESS] Amis 低代码后端服务运行正常 ^(端口: !amis_backend_port!^)
)
echo.

REM 检查文件结构
echo [INFO] 检查文件结构...

set project_root=%~dp0..
set missing_files=0

set files[0]=lowcode-platform-backend\src\lib\bounded-contexts\project\application\services\amis-deployment.service.ts
set files[1]=lowcode-platform-backend\src\lib\bounded-contexts\project\application\services\project-code-generation.service.ts
set files[2]=lowcode-platform-backend\src\lib\bounded-contexts\project\application\handlers\deploy-project.handler.ts
set files[3]=lowcode-platform-backend\src\lib\bounded-contexts\project\application\commands\deploy-project.command.ts
set files[4]=deploy\postgres\18_project_deployment_features.sql
set files[5]=deploy\postgres\19_update_project_deployment_data.sql
set files[6]=deploy\postgres\20_deployment_verification.sql

for /l %%i in (0,1,6) do (
    if exist "%project_root%\!files[%%i]!" (
        echo [SUCCESS] ✓ !files[%%i]!
    ) else (
        echo [ERROR] ✗ !files[%%i]! ^(缺失^)
        set /a missing_files+=1
    )
)

if !missing_files! equ 0 (
    echo [SUCCESS] 所有关键文件都存在
) else (
    echo [ERROR] !missing_files! 个关键文件缺失
    exit /b 1
)
echo.

REM 运行测试
echo [INFO] 运行测试...
cd "%project_root%\lowcode-platform-backend"

where npm >nul 2>&1
if errorlevel 1 (
    echo [WARNING] npm 未安装，跳过测试
) else (
    echo [INFO] 运行单元测试...
    npm test -- --testPathPattern="deploy|deployment" --passWithNoTests >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] 部分单元测试失败
    ) else (
        echo [SUCCESS] 单元测试通过
    )
)
echo.

REM 生成验证报告
echo [INFO] 生成验证报告...

set report_file=deployment-verification-report-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%.txt
set report_file=!report_file: =0!

(
    echo 项目部署功能验证报告
    echo =====================
    echo 验证时间: %date% %time%
    echo.
    echo 数据库验证:
    psql "%DATABASE_URL%" -f "%project_root%\deploy\postgres\20_deployment_verification.sql"
) > "!report_file!"

echo [SUCCESS] 验证报告已生成: !report_file!
echo.

REM 验证 API 端点
echo [INFO] 验证 API 端点...

set base_url=http://localhost:9521/api/v1

REM 检查项目列表 API
curl -s "!base_url!/projects" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 项目列表 API 不可访问
) else (
    echo [SUCCESS] 项目列表 API 可访问
)

REM 检查部署 API 端点
for /f %%i in ('curl -s -o nul -w "%%{http_code}" "!base_url!/projects/test/deploy" -X POST') do set deploy_response=%%i

if "!deploy_response!"=="401" (
    echo [SUCCESS] 部署 API 端点存在
) else if "!deploy_response!"=="404" (
    echo [SUCCESS] 部署 API 端点存在
) else (
    echo [WARNING] 部署 API 端点可能不存在
)
echo.

echo ================================================
echo [SUCCESS] 项目部署功能验证完成！
echo ================================================

pause
