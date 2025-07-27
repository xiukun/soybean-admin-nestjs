@echo off
chcp 65001 >nul
echo 🚀 启动低代码平台开发环境...

REM 检查Docker是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未运行，请先启动Docker
    exit /b 1
)

REM 停止现有容器
echo 🛑 停止现有容器...
docker-compose -f docker-compose.dev.yml down

REM 启动数据库服务
echo 🗄️ 启动数据库服务...
docker-compose -f docker-compose.dev.yml up -d postgres redis

REM 等待数据库就绪
echo ⏳ 等待数据库就绪...
set timeout=60
set counter=0

:wait_loop
docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U soybean -d soybean-admin-nest-backend >nul 2>&1
if %errorlevel% equ 0 goto db_ready

if %counter% geq %timeout% (
    echo ❌ 数据库启动超时
    exit /b 1
)

echo 等待数据库启动... (%counter%/%timeout%)
timeout /t 2 /nobreak >nul
set /a counter+=2
goto wait_loop

:db_ready
echo ✅ 数据库已就绪

REM 设置环境变量
set DATABASE_URL=postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=lowcode
set USE_REAL_DATABASE=true
set REDIS_HOST=localhost
set REDIS_PORT=26379
set REDIS_PASSWORD=123456
set REDIS_DB=2

REM 生成Prisma客户端
echo 🔧 生成Prisma客户端...
call npm run prisma:generate

REM 推送数据库架构
echo 📊 推送数据库架构...
call npx prisma db push --accept-data-loss

REM 运行种子数据
echo 🌱 运行种子数据...
call npm run db:seed

echo 🎉 开发环境启动完成！
echo.
echo 📋 服务信息：
echo   - PostgreSQL: localhost:25432
echo   - Redis: localhost:26379
echo   - 数据库: soybean-admin-nest-backend
echo   - Schema: lowcode
echo.
echo 🚀 启动开发服务器：
echo   npm run start:dev
echo.
echo 🔍 查看数据库：
echo   npm run prisma:studio
echo.
echo 🛑 停止服务：
echo   docker-compose -f docker-compose.dev.yml down

pause
