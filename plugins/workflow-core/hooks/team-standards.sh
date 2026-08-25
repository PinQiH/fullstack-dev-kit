#!/usr/bin/env bash
# =============================================================================
# team-standards.sh
# SessionStart hook — 每次開場注入團隊技術標準（取代個人 rules/ 常駐）
#
# 只放「團隊技術標準」，不放個人偏好（如回應語言）。
# 依賴最小化：純 cat，不需要 python / jq。
# =============================================================================
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STD="$DIR/team-standards.md"
[ -f "$STD" ] && cat "$STD"
exit 0
