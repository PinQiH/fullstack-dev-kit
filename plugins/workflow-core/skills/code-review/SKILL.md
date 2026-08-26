---
name: code-review
description: '審查本機 staged、working tree、指定檔案或遠端 Pull Request 的正確性、安全性、效能、可維護性與測試完整性。'
---

# 程式碼審查

針對本機開發變更或遠端 Pull Request 進行完整的 Code Review。預設只執行唯讀檢查，不切換分支、不修改檔案，也不提交審查結果到遠端；需要這些動作時先取得使用者授權。

## 必讀參考

開始審查前先讀取 [詳細審查指南](references/review-guidelines.md)，再依變更內容載入其中連結的 `references/rules/` 詳細規則。至少涵蓋正確性與可維護性；涉及資料庫、輸出內容或查詢效能時，另外載入 SQL injection、XSS 與 N+1 對應規則。

## 審查工作管線 (Workflow)

### 1. 決定審查目標 (Determine Review Target)
*   **遠端 PR (Remote PR)**：如果使用者提供了 PR 編號或網址 (例如：「請 review PR #123」)，則將目標設定為該遠端 PR。
*   **本地端變更 (Local Changes)**：如果沒有指定 PR，或是使用者要求「review 我的變更」，則將目標設定為當前本地端的檔案系統狀態 (包含暫存與未暫存的變更)。

### 2. 準備工作 (Preparation)

#### 針對遠端 PRs：
1.  **唯讀取得內容**：優先使用 GitHub CLI 讀取 PR 描述、留言與 diff，不切換目前分支。
2.  **執行檢查 (Preflight)**：若需要執行專案標準的驗證腳本，先向使用者說明時間與環境影響。
    ```bash
    npm run preflight
    ```
3.  **了解上下文 (Context)**：閱讀 PR 的描述與現有留言，以理解變更目標與歷史脈絡。

#### 針對本地端變更：
1.  **識別變更 (Identify Changes)**：
    *   檢查狀態：`git status`
    *   閱讀差異：`git diff` (工作區) 或 `git diff --staged` (暫存區)。
2.  **執行檢查 (Preflight - 選擇性)**：如果變更幅度較大，請在開始審查前詢問使用者是否需要先執行 `npm run preflight`。

### 3. 深入分析 (In-Depth Analysis)
基於以下幾個核心支柱，分析程式碼的變更：

*   **正確性 (Correctness)**：程式碼是否達成了預期的目的？有沒有任何 bug 或邏輯錯誤？
*   **可維護性 (Maintainability)**：程式碼是否乾淨、結構良好，並且容易在未來理解與修改？請考量程式碼的清晰度、模組化程度，以及是否遵守既定的設計模式。
*   **可讀性 (Readability)**：必要的註解是否有寫？格式是否一致，並且遵守我們專案的程式碼風格規範？
*   **效能 (Efficiency)**：這次變更是否引入了任何明顯的效能瓶頸或資源浪費？
*   **安全性 (Security)**：是否有任何潛在的安全漏洞 (Vulnerabilities) 或是不安全的寫法？
*   **極端情況與錯誤處理 (Edge Cases and Error Handling)**：程式碼是否適當地處理了邊界條件以及潛在的錯誤？
*   **可測試性 (Testability)**：新增或修改的程式碼是否有足夠的測試覆蓋率 (即使 preflight 驗證通過)？請建議可以提升覆蓋率或強健度的額外測試案例。

### 4. 提供回饋 (Provide Feedback)

#### 結構 (Structure)
*   **總結 (Summary)**：提供一份審查的高階概覽。
*   **發現的問題 (Findings)**：
    *   **嚴重 (Critical)**：Bugs、安全性問題或破壞性變更 (Breaking changes)。
    *   **改善建議 (Improvements)**：提升程式碼品質或效能的建議。
    *   **吹毛求疵 (Nitpicks)**：排版或輕微的風格問題 (選擇性提出)。
*   **結論 (Conclusion)**：給出明確的建議 (通過 Approved / 要求修改 Request Changes)。

#### 語氣 (Tone)
*   保持建設性、專業且友善的態度。
*   清楚解釋**為什麼**要求修改。
*   如果選擇通過 (Approve)，請肯定這份貢獻的具體價值。

### 5. 完成條件
*   回報所有具體 findings；若沒有問題，明確說明未發現需要阻擋的項目。
*   說明已執行與未執行的驗證，不把未驗證內容描述成已確認。
