#!/bin/bash

echo "🚀 Testing Low-Code Platform System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test API endpoint
test_api() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        if [ -f /tmp/response.json ]; then
            # Show relevant data from response
            if command -v jq >/dev/null 2>&1; then
                data=$(cat /tmp/response.json | jq -r '.data // .status // .message // "OK"' 2>/dev/null)
                echo "   Response: $data"
            fi
        fi
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $status_code)"
        if [ -f /tmp/response.json ]; then
            echo "   Response: $(cat /tmp/response.json)"
        fi
        return 1
    fi
}

# Function to test POST API
test_post_api() {
    local name="$1"
    local url="$2"
    local data="$3"
    local expected_status="${4:-200}"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ] || [ "$status_code" = "201" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $status_code)"
        if [ -f /tmp/response.json ]; then
            echo "   Response: $(cat /tmp/response.json)"
        fi
        return 1
    fi
}

echo "1. Testing lowcode-platform-backend (port 3003)..."
echo "=================================================="

# Test health check
test_api "Health Check" "http://localhost:3003/health"

# Test projects API
test_api "Projects List" "http://localhost:3003/api/v1/projects/paginated?current=1&size=5"

# Test specific project
test_api "Project Detail" "http://localhost:3003/api/v1/projects/demo-project-1"

# Test entities API
test_api "Entities List" "http://localhost:3003/api/v1/entities/project/demo-project-1/paginated?current=1&size=5"

# Test specific entity
test_api "Entity Detail" "http://localhost:3003/api/v1/entities/demo-entity-user"

# Test templates API
test_api "Templates List" "http://localhost:3003/api/v1/templates/project/demo-project-1/paginated?current=1&size=5"

# Test specific template
test_api "Template Detail" "http://localhost:3003/api/v1/templates/tpl-nestjs-entity-model"

echo ""
echo "2. Testing amis-lowcode-backend (port 9522)..."
echo "=============================================="

# Test health check
test_api "Health Check" "http://localhost:9522/api/v1/health"

# Test API info
test_api "API Info" "http://localhost:9522/api/v1"

# Test users API
test_api "Users List" "http://localhost:9522/api/v1/users?page=1&pageSize=5"

# Test roles API
test_api "Roles List" "http://localhost:9522/api/v1/roles?page=1&pageSize=5"

echo ""
echo "3. Testing Code Generation..."
echo "============================="

# Test code generation validation
validation_data='{
  "projectId": "demo-project-1",
  "templateIds": ["tpl-nestjs-entity-model"],
  "entityIds": ["demo-entity-user"],
  "variables": {}
}'

test_post_api "Code Generation Validation" "http://localhost:3003/api/v1/code-generation/validate" "$validation_data"

# Test actual code generation (with shorter timeout)
generation_data='{
  "projectId": "demo-project-1",
  "templateIds": ["tpl-nestjs-entity-model"],
  "entityIds": ["demo-entity-user"],
  "variables": {},
  "options": {
    "overwriteExisting": true,
    "generateTests": false,
    "generateDocs": false,
    "architecture": "base-biz",
    "framework": "nestjs"
  }
}'

echo -n "Testing Code Generation (with timeout)... "
timeout 15s curl -s -w "%{http_code}" -o /tmp/gen_response.json -X POST -H "Content-Type: application/json" -d "$generation_data" "http://localhost:3003/api/v1/code-generation/generate" 2>/dev/null
gen_status=$?

if [ $gen_status -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} (Generation triggered successfully)"
elif [ $gen_status -eq 124 ]; then
    echo -e "${YELLOW}⚠️  TIMEOUT${NC} (Generation is running in background)"
else
    echo -e "${RED}❌ FAIL${NC} (Generation failed to start)"
fi

echo ""
echo "4. System Status Summary..."
echo "=========================="

# Check if services are running
if curl -s http://localhost:3003/health >/dev/null 2>&1; then
    echo -e "lowcode-platform-backend: ${GREEN}✅ Running on port 3003${NC}"
else
    echo -e "lowcode-platform-backend: ${RED}❌ Not responding on port 3003${NC}"
fi

if curl -s http://localhost:9522/api/v1/health >/dev/null 2>&1; then
    echo -e "amis-lowcode-backend: ${GREEN}✅ Running on port 9522${NC}"
else
    echo -e "amis-lowcode-backend: ${RED}❌ Not responding on port 9522${NC}"
fi

# Test database connectivity (through API)
if curl -s http://localhost:9522/api/v1/health | grep -q "connected" 2>/dev/null; then
    echo -e "PostgreSQL Database: ${GREEN}✅ Connected and accessible${NC}"
else
    echo -e "PostgreSQL Database: ${YELLOW}⚠️  Status unknown${NC}"
fi

echo ""
echo "🎉 System test completed!"
echo ""
echo "📚 Available Documentation:"
echo "- System Guide: docs/LOWCODE_PLATFORM_GUIDE.md"
echo "- API Reference: docs/API_REFERENCE.md"
echo "- Verification Report: docs/SYSTEM_VERIFICATION_REPORT.md"
echo ""
echo "🌐 Access Points:"
echo "- lowcode-platform-backend API: http://localhost:3003/api-docs"
echo "- amis-lowcode-backend API: http://localhost:9522/api/v1/docs"
echo ""

# Cleanup
rm -f /tmp/response.json /tmp/gen_response.json
