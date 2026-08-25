---
description: 對程式進行 Code Review，呼叫 code-reviewer agent 進行獨立審查
---

# 執行 Code Review 流程

此指令會呼叫 `code-reviewer` agent，在獨立的上下文中對你的程式碼進行完整審查。

## 執行流程

1. **確認審查目標**：
   - 確認範圍（PR URL / PR ID / 當前工作區變更 / 指定檔案）
   - 若為 PR，詢問是否先執行 `npm run preflight`

2. **呼叫 `code-reviewer` agent 進行審查**：
   - Agent 從安全性、效能、正確性、可維護性四個維度獨立審查
   - 產出結構化報告（含嚴重程度分級與具體修復建議）

3. **後續清理（若為遠端 PR）**：
   - 審查完畢後，詢問是否切換回主分支（`main` 或 `master`）
