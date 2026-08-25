#!/usr/bin/env bash
# =============================================================================
# secrets-guard.sh
# PostToolUse hook — 在 Claude 寫入或編輯檔案後，掃描是否有機密資訊被寫入
#
# 對應 Husky 概念：防止 .env / secrets 被意外 commit 的保護層
# 觸發時機：Write、Edit 工具執行完畢後
# =============================================================================

set -euo pipefail

# > 讀取 stdin（Claude Code 傳入的 JSON 工具結果）
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
inp = data.get('tool_input', {})
print(inp.get('file_path', inp.get('path', '')))
" 2>/dev/null || echo "")

# > 若無法解析檔案路徑，直接放行
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# > 跳過不存在的檔案
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# > 跳過二進位檔、lock 檔、schema 檔
case "$FILE_PATH" in
  *.png|*.jpg|*.gif|*.ico|*.woff|*.ttf|*.lock|*.xsd|*.jsonl)
    exit 0 ;;
esac

# > 機密資訊偵測規則
SECRETS_FOUND=0
MESSAGES=()

# - 偵測常見 API Key 格式
if grep -qE "(api_key|apikey|api-key)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{20,}" "$FILE_PATH" 2>/dev/null; then
  SECRETS_FOUND=1
  MESSAGES+=("偵測到疑似 API Key 字串")
fi

# - 偵測 JWT / Bearer Token（長字串含點分隔）
if grep -qE "eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}" "$FILE_PATH" 2>/dev/null; then
  SECRETS_FOUND=1
  MESSAGES+=("偵測到疑似 JWT Token")
fi

# - 偵測 AWS 金鑰
if grep -qE "AKIA[A-Z0-9]{16}" "$FILE_PATH" 2>/dev/null; then
  SECRETS_FOUND=1
  MESSAGES+=("偵測到疑似 AWS Access Key ID")
fi

# - 偵測私鑰 PEM 格式
if grep -q "BEGIN.*PRIVATE KEY" "$FILE_PATH" 2>/dev/null; then
  SECRETS_FOUND=1
  MESSAGES+=("偵測到疑似私鑰（PEM 格式）")
fi

# - 偵測 hardcode 的密碼賦值（排除測試檔案）
if [[ "$FILE_PATH" != *test* && "$FILE_PATH" != *spec* && "$FILE_PATH" != *mock* ]]; then
  if grep -qE "password\s*[:=]\s*['\"][^'\"]{6,}['\"]" "$FILE_PATH" 2>/dev/null; then
    SECRETS_FOUND=1
    MESSAGES+=("偵測到疑似 hardcode 密碼（非測試檔案）")
  fi
fi

# > 輸出結果
if [ "$SECRETS_FOUND" -eq 1 ]; then
  echo ""
  echo "⚠️  [secrets-guard] 警告：$FILE_PATH"
  for msg in "${MESSAGES[@]}"; do
    echo "   • $msg"
  done
  echo ""
  echo "   建議：請使用環境變數（process.env.XXX）取代 hardcode 的機密資訊。"
  echo "   若為測試用假資料，請加上明顯的假資料標記（如 'test-fake-key-123'）。"
  echo ""
  # !! 回傳非零讓 Claude 看到警告，但不強制阻斷（exit 2 = 警告級）
  exit 2
fi

exit 0
