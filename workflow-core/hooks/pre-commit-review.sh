#!/usr/bin/env bash
# =============================================================================
# pre-commit-review.sh
# PreToolUse hook — 攔截 git commit，強制 Claude 先完成自我審查
#
# 對應 CLAUDE.md 規則：
#   「當你完成一個功能、修改或重構後，在向使用者報告『已完成』或
#    準備 Commit 之前，你必須先主動針對剛剛異動的程式進行自我審查。」
#
# 機制說明：
#   - 首次 git commit → 攔截，輸出審查 checklist，要求完成後再 commit
#   - Claude 完成審查後會建立 .agents/.review-done 標記檔
#   - 標記檔存在且比最新 staged 檔案更新 → 放行 commit，並刪除標記
#   - 觸發時機：Bash 工具執行之前
# =============================================================================

set -euo pipefail

# > 取得 bash 指令
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
print(json.load(sys.stdin).get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

# > 只處理 git commit 指令（排除 --amend --no-edit 等不含新變更的操作）
if ! echo "$COMMAND" | grep -qE "^\s*git commit(\s|$)"; then
  exit 0
fi

# > 若加了 --no-verify，表示使用者明確要求略過所有 hook，直接放行
if echo "$COMMAND" | grep -q "\-\-no-verify"; then
  exit 0
fi

# > 找到 git 專案根目錄
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
REVIEW_FLAG="$PROJECT_ROOT/.agents/.review-done"

# =============================================================================
# @ 情境一：審查標記已存在 → 確認是否比 staged 變更更新，若是則放行
# =============================================================================
if [ -f "$REVIEW_FLAG" ]; then
  # - 取得最新 staged 檔案的修改時間
  STAGED_FILES=$(git diff --cached --name-only 2>/dev/null)

  if [ -z "$STAGED_FILES" ]; then
    # 沒有 staged 變更，直接放行（空 commit 或 --allow-empty）
    rm -f "$REVIEW_FLAG"
    exit 0
  fi

  # - 找出 staged 檔案中最新的修改時間（取最大值）
  NEWEST_STAGED=0
  while IFS= read -r file; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
      MTIME=$(stat -c %Y "$PROJECT_ROOT/$file" 2>/dev/null || stat -f %m "$PROJECT_ROOT/$file" 2>/dev/null || echo 0)
      if [ "$MTIME" -gt "$NEWEST_STAGED" ]; then
        NEWEST_STAGED=$MTIME
      fi
    fi
  done <<< "$STAGED_FILES"

  FLAG_MTIME=$(stat -c %Y "$REVIEW_FLAG" 2>/dev/null || stat -f %m "$REVIEW_FLAG" 2>/dev/null || echo 0)

  if [ "$FLAG_MTIME" -ge "$NEWEST_STAGED" ]; then
    # ✓ 審查標記比所有 staged 檔案都新 → 審查有效，放行並清除標記
    echo ""
    echo "✅ [pre-commit-review] 審查已完成，允許 commit"
    echo ""
    rm -f "$REVIEW_FLAG"
    exit 0
  else
    # !! 標記比某些 staged 檔案舊 → 審查後又有新變更，需重新審查
    rm -f "$REVIEW_FLAG"
  fi
fi

# =============================================================================
# @ 情境二：無審查標記 → 攔截 commit，輸出審查要求
# =============================================================================
STAGED_STAT=$(git diff --cached --stat 2>/dev/null)

if [ -z "$STAGED_STAT" ]; then
  # 沒有 staged 變更，直接放行
  exit 0
fi

STAGED_FILES=$(git diff --cached --name-only 2>/dev/null)
FILE_COUNT=$(echo "$STAGED_FILES" | grep -c . 2>/dev/null || echo 0)

# =============================================================================
# @ 自動掃描：偵測 debug 殘留
#   - debugger 語句       → 阻斷（exit 1）
#   - console.log 等 log  → 僅列出位置，不阻斷（繼續往下走）
# =============================================================================
BLOCKER_FINDINGS=""   # 阻斷類：debugger
NOTICE_FINDINGS=""    # 提示類：console.log / console.debug / print DEBUG

while IFS= read -r file; do
  # - 只掃描程式碼檔案，跳過測試檔與鎖定檔
  case "$file" in
    *.test.*|*.spec.*|*__tests__*|package-lock.json|yarn.lock|*.lock) continue ;;
    *.js|*.ts|*.jsx|*.tsx|*.mjs|*.cjs|*.py|*.go) ;;
    *) continue ;;
  esac

  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    continue
  fi

  # - 只看 staged 新增行（+ 開頭，排除 +++ 檔頭）
  DIFF_LINES=$(git diff --cached -U0 "$file" 2>/dev/null \
    | grep "^+" | grep -v "^+++" || true)

  # - 阻斷類：debugger 語句（JS/TS）
  BLOCKER_HITS=$(echo "$DIFF_LINES" \
    | grep -nE "^\+\s*debugger\s*;?" || true)

  if [ -n "$BLOCKER_HITS" ]; then
    BLOCKER_FINDINGS="${BLOCKER_FINDINGS}\n  📄 $file:\n"
    while IFS= read -r hit; do
      BLOCKER_FINDINGS="${BLOCKER_FINDINGS}     ${hit}\n"
    done <<< "$BLOCKER_HITS"
  fi

  # - 提示類：console.log / console.debug / console.dir / print DEBUG
  NOTICE_HITS=$(echo "$DIFF_LINES" \
    | grep -nE "console\.(log|debug|dir|trace)\s*\(|print\([\"']DEBUG" || true)

  if [ -n "$NOTICE_HITS" ]; then
    NOTICE_FINDINGS="${NOTICE_FINDINGS}\n  📄 $file:\n"
    while IFS= read -r hit; do
      NOTICE_FINDINGS="${NOTICE_FINDINGS}     ${hit}\n"
    done <<< "$NOTICE_HITS"
  fi
done <<< "$STAGED_FILES"

# - debugger 語句 → 阻斷
if [ -n "$BLOCKER_FINDINGS" ]; then
  echo ""
  echo "🚫 [pre-commit-review] 已攔截 commit — 偵測到 debugger 語句"
  echo ""
  echo "  以下 staged 變更中含有 debugger，請移除後重新 git add 再 commit："
  echo ""
  printf "%b" "$BLOCKER_FINDINGS"
  echo ""
  echo "  若要略過檢查，請加上 --no-verify。"
  echo ""
  exit 1
fi

# - console.log 等 → 僅列出，不阻斷
if [ -n "$NOTICE_FINDINGS" ]; then
  echo ""
  echo "📋 [pre-commit-review] 注意：偵測到 console.log（不阻斷，僅供參考）"
  echo ""
  printf "%b" "$NOTICE_FINDINGS"
  echo ""
fi

echo ""
echo "🔍 [pre-commit-review] 已攔截 commit — 請先完成自我審查"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  本次 staged 變更（共 ${FILE_COUNT} 個檔案）："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$STAGED_STAT"
echo ""
echo "  請依序完成以下審查步驟："
echo ""
echo "  1. 安全性（CRITICAL）"
echo "     □ 無 SQL Injection 風險"
echo "     □ 無 XSS 風險"
echo "     □ 無機密資訊（API Key / 密碼）硬編碼"
echo ""
echo "  2. 正確性（HIGH）"
echo "     □ 錯誤處理完整，無空的 catch / 吞掉的 Promise rejection"
echo "     □ 已處理 Edge case"
echo ""
echo "  3. 效能（HIGH）"
echo "     □ 無 N+1 查詢問題"
echo "     □ 無不必要的同步阻塞操作"
echo ""
echo "  4. 可維護性（MEDIUM）"
echo "     □ 命名清晰，無過度縮寫"
echo "     □ 無殘留的 console.log / debugger"
echo "     □ 符合 CLAUDE.md 的 Todo-Tree 註解規範"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  完成審查後，請執行以下指令標記為已審查，再重新 commit："
echo ""
echo "    mkdir -p $PROJECT_ROOT/.agents && touch $REVIEW_FLAG"
echo ""
echo "  ⚠️  若要略過審查（不建議），請加上 --no-verify："
echo "    git commit --no-verify -m \"your message\""
echo ""

# !! exit 1 = 阻斷此次 commit，直到審查完成並建立標記為止
exit 1
