#!/usr/bin/env bash
# =============================================================================
# bash-safety.sh
# PreToolUse hook — 在 Claude 執行 Bash 指令前，攔截高風險操作
#
# 對應 Husky 概念：pre-push 防止推送破壞性變更到遠端
# 觸發時機：Bash 工具執行之前
# =============================================================================

set -euo pipefail
PY=""; for c in python3 python py; do if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then PY="$c"; break; fi; done; if [ -z "$PY" ]; then exit 0; fi

# > 讀取 stdin（Claude Code 傳入的 JSON 工具輸入）
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | "$PY" -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

# > 若無法解析指令，直接放行
if [ -z "$COMMAND" ]; then
  exit 0
fi

BLOCKED=0
REASON=""

# > 規則一：禁止 force push（保護遠端歷史）
if echo "$COMMAND" | grep -qE "git push.*(--force|-f)(\s|$)"; then
  BLOCKED=1
  REASON="git push --force 可能覆蓋他人的遠端提交，屬於破壞性操作。"
fi

# > 規則二：禁止刪除遠端分支（需人工確認）
if echo "$COMMAND" | grep -qE "git push.*:([a-zA-Z0-9/_\-]+)"; then
  BLOCKED=1
  REASON="偵測到刪除遠端分支的指令（git push origin :branch-name），此操作不可逆。"
fi

# > 規則三：禁止 git reset --hard（未保存的變更會消失）
if echo "$COMMAND" | grep -qE "git reset --hard"; then
  BLOCKED=1
  REASON="git reset --hard 會永久丟棄未提交的變更，請先確認工作區已備份。"
fi

# > 規則四：禁止對根目錄或 src/ 執行 rm -rf
if echo "$COMMAND" | grep -qE "rm\s+-rf?\s+(/|\.\/src|src/|node_modules/\.\.|\$\(pwd\))"; then
  BLOCKED=1
  REASON="偵測到高風險的 rm -rf 操作，目標路徑可能影響整個專案或系統目錄。"
fi

# > 規則五：禁止直接寫入 .env 檔（應由使用者手動操作）
if echo "$COMMAND" | grep -qE "(echo|printf|tee|cat).*>\s*\.env(\s|$)"; then
  BLOCKED=1
  REASON="禁止自動覆寫 .env 檔，機密設定應由開發者手動維護。"
fi

# > 規則六：禁止 DROP TABLE / DROP DATABASE（生產資料庫保護）
if echo "$COMMAND" | grep -qiE "(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)"; then
  BLOCKED=1
  REASON="偵測到資料庫破壞性指令（DROP / TRUNCATE），禁止自動執行。"
fi

# > 輸出結果
if [ "$BLOCKED" -eq 1 ]; then
  echo ""
  echo "🚫 [bash-safety] 已攔截高風險指令"
  echo ""
  echo "   指令：$COMMAND"
  echo "   原因：$REASON"
  echo ""
  echo "   若確認需要執行，請由使用者在終端機中手動操作。"
  echo ""
  # !! exit 1 = 阻斷，Claude 不會執行此指令
  exit 1
fi

exit 0
