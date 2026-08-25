#!/usr/bin/env bash
# =============================================================================
# lint-on-save.sh
# PostToolUse hook — Claude 寫入程式碼檔案後，自動執行 Lint 並回報問題
#
# 支援語言：
#   - JS / TS / JSX / TSX → ESLint
#   - Python (.py)        → ruff（優先）或 flake8（fallback）
#
# 對應 Husky 概念：pre-commit 的 lint-staged（只掃有變動的檔案）
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

# > 只處理支援的語言，其餘靜默放行
case "$FILE_PATH" in
  *.js|*.ts|*.cjs|*.mjs|*.jsx|*.tsx|*.py) ;;
  *) exit 0 ;;
esac

# > 跳過不存在的檔案
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# > 跳過測試檔
case "$FILE_PATH" in
  *.test.*|*.spec.*|*/__tests__/*|*/test/*) exit 0 ;;
esac

PROJECT_ROOT=$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null || dirname "$FILE_PATH")

# =============================================================================
# @ JS / TS → ESLint
# =============================================================================
case "$FILE_PATH" in
  *.js|*.ts|*.cjs|*.mjs|*.jsx|*.tsx)

    ESLINT_BIN=""
    if [ -f "$PROJECT_ROOT/node_modules/.bin/eslint" ]; then
      ESLINT_BIN="$PROJECT_ROOT/node_modules/.bin/eslint"
    elif command -v eslint &>/dev/null; then
      ESLINT_BIN="eslint"
    fi

    if [ -z "$ESLINT_BIN" ]; then
      exit 0
    fi

    LINT_OUTPUT=$("$ESLINT_BIN" --no-eslintrc -c "$PROJECT_ROOT/.eslintrc.js" --quiet "$FILE_PATH" 2>&1 || true)

    if echo "$LINT_OUTPUT" | grep -qE "error|warning"; then
      echo ""
      echo "🔍 [lint-on-save] ESLint 發現問題：$FILE_PATH"
      echo ""
      echo "$LINT_OUTPUT" | head -30
      echo ""
      echo "   請修復上述 lint 問題後再繼續。"
      echo ""
      exit 2
    fi
    ;;

# =============================================================================
# @ Python → ruff（優先）或 flake8（fallback）
# =============================================================================
  *.py)

    PYTHON_LINTER=""
    PYTHON_LINTER_NAME=""

    # - 尋找 ruff（優先：速度快，現代 Python linter）
    for candidate in \
      "$PROJECT_ROOT/.venv/bin/ruff" \
      "$PROJECT_ROOT/venv/bin/ruff" \
      "$PROJECT_ROOT/env/bin/ruff"; do
      if [ -f "$candidate" ]; then
        PYTHON_LINTER="$candidate"
        PYTHON_LINTER_NAME="ruff"
        break
      fi
    done

    if [ -z "$PYTHON_LINTER" ] && command -v ruff &>/dev/null; then
      PYTHON_LINTER="ruff"
      PYTHON_LINTER_NAME="ruff"
    fi

    # - fallback：flake8
    if [ -z "$PYTHON_LINTER" ]; then
      for candidate in \
        "$PROJECT_ROOT/.venv/bin/flake8" \
        "$PROJECT_ROOT/venv/bin/flake8" \
        "$PROJECT_ROOT/env/bin/flake8"; do
        if [ -f "$candidate" ]; then
          PYTHON_LINTER="$candidate"
          PYTHON_LINTER_NAME="flake8"
          break
        fi
      done
    fi

    if [ -z "$PYTHON_LINTER" ] && command -v flake8 &>/dev/null; then
      PYTHON_LINTER="flake8"
      PYTHON_LINTER_NAME="flake8"
    fi

    # - 找不到任何 linter，靜默放行
    if [ -z "$PYTHON_LINTER" ]; then
      exit 0
    fi

    # - 執行 linter（ruff 與 flake8 指令格式相同）
    LINT_OUTPUT=$("$PYTHON_LINTER" "$FILE_PATH" 2>&1 || true)

    if [ -n "$LINT_OUTPUT" ]; then
      echo ""
      echo "🔍 [lint-on-save] ${PYTHON_LINTER_NAME} 發現問題：$FILE_PATH"
      echo ""
      echo "$LINT_OUTPUT" | head -30
      echo ""
      echo "   請修復上述 lint 問題後再繼續。"
      echo ""
      exit 2
    fi
    ;;
esac

exit 0
