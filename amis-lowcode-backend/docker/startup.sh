#!/bin/sh

# Amis Low-code Backend Startup Script
# This script handles database initialization and application startup

set -e

# Ensure correct permissions for node_modules
if [ -d "node_modules" ]; then
    echo "🔐 Ensuring correct permissions for node_modules..."
    sudo chown -R node:node node_modules
fi

echo "🚀 Starting Amis Low-code Backend..."

# Environment variables with defaults
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-9522}
AUTO_INIT_DATA=${AUTO_INIT_DATA:-true}
FIRST_RUN_DETECTION=${FIRST_RUN_DETECTION:-true}
DOCKER_ENV=${DOCKER_ENV:-true}

echo "📋 Environment Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  AUTO_INIT_DATA: $AUTO_INIT_DATA"
echo "  FIRST_RUN_DETECTION: $FIRST_RUN_DETECTION"
echo "  DOCKER_ENV: $DOCKER_ENV"

# Function to check if database is accessible
check_database() {
    echo "🔍 Checking database connection..."

    # Extract database connection details from DATABASE_URL
    if [ -n "$DATABASE_URL" ]; then
        echo "  Database URL configured: ${DATABASE_URL%@*}@***"

        # Extract connection details from DATABASE_URL
        # Format: postgresql://user:password@host:port/database
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

        # Use nc (netcat) to check if database port is accessible
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "  ✅ Database connection successful"
            return 0
        else
            echo "  ❌ Database connection failed"
            return 1
        fi
    else
        echo "  ❌ DATABASE_URL not configured"
        return 1
    fi
}

# Function to detect if this is the first run
is_first_run() {
    if [ "$FIRST_RUN_DETECTION" != "true" ]; then
        echo "🔍 First run detection disabled"
        return 1
    fi
    
    echo "🔍 Detecting if this is the first run..."
    
    # Check if schema exists and has tables
    if npx prisma db pull --preview-feature 2>/dev/null; then
        # Check if we have any tables (basic check)
        TABLE_COUNT=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | npx prisma db execute --stdin 2>/dev/null | tail -n 1 | tr -d ' ')
        if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
            echo "  📦 No tables found - this appears to be the first run"
            return 0
        else
            echo "  📋 Tables found - not the first run"
            return 1
        fi
    else
        echo "  📦 Database schema doesn't exist - this is the first run"
        return 0
    fi
}

# Function to initialize database schema
init_database_schema() {
    echo "🗄️ Initializing database schema..."
    
    # Deploy Prisma schema
    if npx prisma db push --accept-data-loss; then
        echo "  ✅ Database schema deployed successfully"
    else
        echo "  ❌ Failed to deploy database schema"
        exit 1
    fi
    
    # Generate Prisma client in runtime with proper permissions
    echo "  🔧 Generating Prisma client..."

    # Create .prisma directory with proper permissions
    sudo mkdir -p node_modules/.prisma/client
    sudo chown -R node:node node_modules/.prisma

    if npx prisma generate; then
        echo "  ✅ Prisma client generated successfully"
    else
        echo "  ⚠️ Failed to generate Prisma client, trying with sudo..."
        # Try to generate as root and then change ownership
        if sudo npx prisma generate; then
            sudo chown -R node:node node_modules/.prisma
            echo "  ✅ Prisma client generated with sudo"
        else
            echo "  ❌ Failed to generate Prisma client"
            exit 1
        fi
    fi
}

# Function to seed initial data
seed_initial_data() {
    echo "🌱 Seeding initial data..."
    
    # Check if seed script exists
    if [ -f "prisma/seed.js" ] || [ -f "prisma/seed.ts" ]; then
        if npx prisma db seed; then
            echo "  ✅ Initial data seeded successfully"
        else
            echo "  ⚠️ Failed to seed initial data (continuing anyway)"
        fi
    else
        echo "  ℹ️ No seed script found, skipping data seeding"
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    # Check if migrations directory exists
    if [ -d "prisma/migrations" ]; then
        if npx prisma migrate deploy; then
            echo "  ✅ Migrations applied successfully"
        else
            echo "  ❌ Failed to apply migrations"
            exit 1
        fi
    else
        echo "  ℹ️ No migrations directory found, using db push instead"
        init_database_schema
    fi
}

# Function to start the application
start_application() {
    echo "🚀 Starting the application..."
    
    # Start the NestJS application
    exec node dist/main.js
}

# Main execution flow
main() {
    echo "🎯 Starting initialization process..."
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_database; then
            break
        fi
        
        echo "  ⏳ Attempt $attempt/$max_attempts - waiting 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        echo "  ❌ Database not ready after $max_attempts attempts"
        exit 1
    fi
    
    # Handle first run initialization
    if [ "$AUTO_INIT_DATA" = "true" ] && is_first_run; then
        echo "🎉 First run detected - initializing system..."
        init_database_schema
        seed_initial_data
    else
        echo "🔄 Regular startup - running migrations..."
        run_migrations
    fi
    
    echo "✅ Initialization completed successfully!"
    echo ""
    echo "🌟 Amis Low-code Backend is ready!"
    echo "   Port: $PORT"
    echo "   Environment: $NODE_ENV"
    echo "   Health Check: http://localhost:$PORT/api/v1/health"
    echo ""
    
    # Start the application
    start_application
}

# Handle signals for graceful shutdown
trap 'echo "🛑 Received shutdown signal, stopping..."; exit 0' TERM INT

# Run main function
main "$@"
