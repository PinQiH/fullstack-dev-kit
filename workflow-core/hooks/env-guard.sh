#!/usr/bin/env bash
# =============================================================================
# env-guard.sh
# PreToolUse hook — 攔截 Claude 嘗試讀取機密檔案的行為
#
# 守備範圍：
#   - Read 工具：直接讀取 .env / .pem / 私鑰等檔案
#   - Bash 工具：透過 cat / less / head 等指令讀取機密檔案
#
# 對應 CLAUDE.md 規則：「請勿主動讀取或編輯 .env 檔」
# 觸發時機：Read、Bash 工具執行之前
# =============================================================================

set -euo pipefail
PY=""; for c in python3 python py; do if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then PY="$c"; break; fi; done; if [ -z "$PY" ]; then exit 0; fi

# > 讀取 stdin，取得工具名稱與輸入
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | "$PY" -c "
import json, sys
print(json.load(sys.stdin).get('tool_name', ''))
" 2>/dev/null || echo "")

# =============================================================================
# @ 情境零：Claude 使用 Glob 工具掃描機密檔案路徑
# =============================================================================
if [ "$TOOL_NAME" = "Glob" ]; then
  PATTERN=$(echo "$INPUT" | "$PY" -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('pattern', ''))
" 2>/dev/null || echo "")

  # - 偵測 Glob pattern 中是否含有機密檔案模式
  IS_SECRET=0
  SECRET_TYPE=""

  case "$PATTERN" in
    *".env"*|*".env."*)
      IS_SECRET=1; SECRET_TYPE=".env 檔案掃描" ;;
    *".pem"|*"*.pem")
      IS_SECRET=1; SECRET_TYPE="PEM 憑證掃描" ;;
    *".key"|*"*.key")
      IS_SECRET=1; SECRET_TYPE="私鑰檔掃描" ;;
    *"id_rsa"*|*"id_ed25519"*|*"id_ecdsa"*)
      IS_SECRET=1; SECRET_TYPE="SSH 私鑰掃描" ;;
    *"secrets"*|*"credentials"*)
      IS_SECRET=1; SECRET_TYPE="機密設定檔掃描" ;;
  esac

  # !! 若 pattern 指向機密路徑，阻斷並說明
  if [ "$IS_SECRET" -eq 1 ]; then
    echo ""
    echo "🔒 [env-guard] 已阻斷 Glob：禁止掃描機密檔案路徑"
    echo ""
    echo "   Pattern：$PATTERN"
    echo "   類型：$SECRET_TYPE"
    echo ""
    echo "   原因：此 Glob pattern 可能用於定位機密檔案。"
    echo "         即使不直接讀取內容，路徑資訊本身也屬敏感資料。"
    echo ""
    echo "   若確實需要確認某設定檔是否存在，請向使用者說明需求。"
    echo ""
    exit 1
  fi
fi

# =============================================================================
# @ 情境一：Claude 使用 Read 工具直接讀取檔案
# =============================================================================
if [ "$TOOL_NAME" = "Read" ]; then
  FILE_PATH=$(echo "$INPUT" | "$PY" -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

  FILENAME=$(basename "$FILE_PATH")

  # - 判斷是否為機密檔案（依檔名模式）
  IS_SECRET=0
  SECRET_TYPE=""

  case "$FILENAME" in
    .env)
      IS_SECRET=1; SECRET_TYPE=".env 環境變數檔" ;;
    .env.*)
      IS_SECRET=1; SECRET_TYPE=".env 衍生檔（${FILENAME}）" ;;
    *.pem)
      IS_SECRET=1; SECRET_TYPE="PEM 憑證檔" ;;
    *.key)
      IS_SECRET=1; SECRET_TYPE="私鑰檔" ;;
    *.pfx|*.p12)
      IS_SECRET=1; SECRET_TYPE="PKCS 憑證檔" ;;
    id_rsa|id_ed25519|id_ecdsa|id_dsa)
      IS_SECRET=1; SECRET_TYPE="SSH 私鑰" ;;
    .netrc)
      IS_SECRET=1; SECRET_TYPE=".netrc 認證設定檔" ;;
    credentials|secrets.json|secret.json|secrets.yaml|secrets.yml)
      IS_SECRET=1; SECRET_TYPE="機密設定檔（${FILENAME}）" ;;
  esac

  # !! 若為機密檔案，阻斷並說明原因
  if [ "$IS_SECRET" -eq 1 ]; then
    echo ""
    echo "🔒 [env-guard] 已阻斷 Read：禁止讀取機密檔案"
    echo ""
    echo "   檔案：$FILE_PATH"
    echo "   類型：$SECRET_TYPE"
    echo ""
    echo "   原因：此類檔案可能含有 API Keys、密碼、私鑰等機密資訊。"
    echo "         根據 CLAUDE.md 規則，Claude 不應主動讀取或操作機密檔案。"
    echo ""
    echo "   若確實需要特定環境變數的值，請向使用者詢問，由使用者提供。"
    echo ""
    exit 1
  fi
fi

# =============================================================================
# @ 情境二：Claude 使用 Bash 工具透過指令讀取機密檔案
# =============================================================================
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$INPUT" | "$PY" -c "
import json, sys
print(json.load(sys.stdin).get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

  # - 偵測讀取類指令 + 機密檔名的組合
  # ?? grep -P 在 macOS 不支援，改用 -E
  if echo "$COMMAND" | grep -qE \
    "(^|\s|\||;)(cat|less|more|head|tail|bat|vim|nano|code|open)\s+.*\.env(\s|$|\.local|\.production|\.development|\.staging|\.test)"; then
    echo ""
    echo "🔒 [env-guard] 已阻斷 Bash：禁止透過指令讀取 .env 檔"
    echo ""
    echo "   指令：$COMMAND"
    echo "   原因：禁止以 shell 指令方式讀取 .env 及其衍生檔。"
    echo ""
    echo "   若需要確認某個環境變數，請向使用者說明需求，由使用者查閱後告知。"
    echo ""
    exit 1
  fi

  # - 偵測讀取 SSH 私鑰
  if echo "$COMMAND" | grep -qE \
    "(^|\s|\||;)(cat|less|more|head|tail)\s+.*(id_rsa|id_ed25519|id_ecdsa|\.pem|\.key)(\s|$)"; then
    echo ""
    echo "🔒 [env-guard] 已阻斷 Bash：禁止讀取私鑰或憑證檔案"
    echo ""
    echo "   指令：$COMMAND"
    echo ""
    exit 1
  fi
fi

exit 0
