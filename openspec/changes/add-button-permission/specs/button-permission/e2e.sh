#!/usr/bin/env bash
set -euo pipefail

# --- Config ---
BASE_URL=${BASE_URL:-"http://localhost:9528/v1"}
IDENTIFIER=${IDENTIFIER:-"admin"}
PASSWORD=${PASSWORD:-"123456"}
DOMAIN=${DOMAIN:-"default"}
ROLE_ID=${ROLE_ID:-"1"}

# 仅用于演示：低代码 save 接口
LOWCODE_SAVE_URL=${LOWCODE_SAVE_URL:-"${BASE_URL}/designer/page/save"}

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[ERR] missing command: $1" >&2
    exit 1
  }
}
need curl
need jq

log() { echo "[INFO] $*"; }

# --- 1) Login ---
log "login: ${IDENTIFIER}"
LOGIN_RES=$(curl -sS -X POST "${BASE_URL}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"${IDENTIFIER}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RES" | jq -r '.data.token // empty')
if [[ -z "$TOKEN" ]]; then
  echo "[ERR] login failed: $LOGIN_RES" >&2
  exit 1
fi
log "token ok"

AUTH_HEADER=( -H "Authorization: Bearer ${TOKEN}" )

# --- 2) Get button tree ---
log "GET /button/tree"
BTN_TREE=$(curl -sS "${BASE_URL}/button/tree" "${AUTH_HEADER[@]}")
echo "$BTN_TREE" | jq '.status,.msg,(.data|type)' >/dev/null

# --- 3) Get role assigned buttons ---
log "GET /button/auth-buttons/:roleId"
ROLE_BTNS=$(curl -sS "${BASE_URL}/button/auth-buttons/${ROLE_ID}" "${AUTH_HEADER[@]}")
echo "$ROLE_BTNS" | jq '.status,.msg,(.data|type)' >/dev/null

# --- 4) Assign buttons to role (optional) ---
# 说明：这里需要你先从 /button/tree 找到想分配的 buttonId 列表，再填到 BUTTON_IDS。
BUTTON_IDS=${BUTTON_IDS:-""}
if [[ -n "$BUTTON_IDS" ]]; then
  log "POST /authorization/assign-buttons roleId=${ROLE_ID} buttonIds=${BUTTON_IDS}"
  curl -sS -X POST "${BASE_URL}/authorization/assign-buttons" \
    "${AUTH_HEADER[@]}" \
    -H 'Content-Type: application/json' \
    -d "{\"domain\":\"${DOMAIN}\",\"roleId\":${ROLE_ID},\"buttonIds\":${BUTTON_IDS}}" \
    | jq
else
  log "skip assign-buttons (set env BUTTON_IDS='[1,2,3]')"
fi

# --- 5) Get user button codes ---
log "GET /authorization/getUserButtons"
USER_BTNS=$(curl -sS "${BASE_URL}/authorization/getUserButtons" "${AUTH_HEADER[@]}")
echo "$USER_BTNS" | jq '.status,.msg,((.data|length)?//0)' 

# --- 6) Button CRUD (optional) ---
MENU_ID=${MENU_ID:-""}
TEST_BUTTON_CODE=${TEST_BUTTON_CODE:-""}
if [[ -n "$MENU_ID" && -n "$TEST_BUTTON_CODE" ]]; then
  log "GET /button/list?menuId=${MENU_ID}"
  curl -sS "${BASE_URL}/button/list?menuId=${MENU_ID}" "${AUTH_HEADER[@]}" | jq '.status,.msg,((.data|length)?//0)'

  log "POST /button create code=${TEST_BUTTON_CODE}"
  CREATE_RES=$(curl -sS -X POST "${BASE_URL}/button" \
    "${AUTH_HEADER[@]}" \
    -H 'Content-Type: application/json' \
    -d "{\"code\":\"${TEST_BUTTON_CODE}\",\"description\":\"e2e\",\"menuId\":${MENU_ID},\"status\":\"ENABLED\",\"order\":999}")
  BTN_ID=$(echo "$CREATE_RES" | jq -r '.data.id // empty')
  if [[ -z "$BTN_ID" ]]; then
    echo "[WARN] create button failed: $CREATE_RES" >&2
  else
    log "PUT /button/${BTN_ID} update"
    curl -sS -X PUT "${BASE_URL}/button/${BTN_ID}" \
      "${AUTH_HEADER[@]}" \
      -H 'Content-Type: application/json' \
      -d "{\"description\":\"e2e-updated\",\"menuId\":${MENU_ID},\"status\":\"DISABLED\",\"order\":998}" \
      | jq

    log "DELETE /button/${BTN_ID}"
    curl -sS -X DELETE "${BASE_URL}/button/${BTN_ID}" \
      "${AUTH_HEADER[@]}" \
      | jq
  fi
else
  log "skip button CRUD (set env MENU_ID=81 TEST_BUTTON_CODE=demo:test)"
fi

# --- 7) Verify lowcode save: should be 200 if has lowcode:save, otherwise 403 ---
log "POST lowcode save (expect 200 or 403)"
set +e
LOWCODE_RES=$(curl -sS -X POST "${LOWCODE_SAVE_URL}" \
  "${AUTH_HEADER[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"pageId":"1","name":"demo","title":"demo","code":"demo","schema":{}}' \
  -w "\n__HTTP_STATUS__:%{http_code}\n")
set -e
HTTP_STATUS=$(echo "$LOWCODE_RES" | sed -n 's/^__HTTP_STATUS__:\([0-9][0-9][0-9]\)$/\1/p')
BODY=$(echo "$LOWCODE_RES" | sed '/^__HTTP_STATUS__:/d')
log "lowcode save http=${HTTP_STATUS}"

if [[ "$HTTP_STATUS" == "403" ]]; then
  log "PASS: forbidden as expected (no lowcode:save)"
  echo "$BODY" | head -c 500
elif [[ "$HTTP_STATUS" == "200" ]]; then
  log "PASS: allowed (has lowcode:save)"
  echo "$BODY" | jq '.status,.msg,.data' || true
else
  echo "[WARN] unexpected status=${HTTP_STATUS}" >&2
  echo "$BODY" | head -c 800
fi

log "done"
