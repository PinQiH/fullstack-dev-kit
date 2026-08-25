---
name: code-reviewer
description: >
  請使用這個技能來進行 Code Review。支援本地端變更 (Staged 或 Working Tree) 
  以及遠端 Pull Requests (透過 ID 或 URL 指定)。審查重點在於正確性、可維護性以及是否符合專案規範。
---

# 程式碼審查 (Code Reviewer)

此技能指導 Agent 針對本地端的開發變更或是遠端的 Pull Requests，進行專業且徹底的程式碼審查 (Code Review)。

## 審查工作管線 (Workflow)

### 1. 決定審查目標 (Determine Review Target)
*   **遠端 PR (Remote PR)**：如果使用者提供了 PR 編號或網址 (例如：「請 review PR #123」)，則將目標設定為該遠端 PR。
*   **本地端變更 (Local Changes)**：如果沒有指定 PR，或是使用者要求「review 我的變更」，則將目標設定為當前本地端的檔案系統狀態 (包含暫存與未暫存的變更)。

### 2. 準備工作 (Preparation)

#### 針對遠端 PRs：
1.  **Checkout**：使用 GitHub CLI 切換到該 PR 的分支。
    ```bash
    gh pr checkout <PR_NUMBER>
    ```
2.  **執行檢查 (Preflight)**：執行專案標準的驗證腳本，及早捕捉自動化測試的錯誤。
    ```bash
    npm run preflight
    ```
3.  **了解上下文 (Context)**：閱讀 PR 的描述與現有的留言，以理解這次變更的目標與歷史脈絡。

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

### 5. 清理環境 (Cleanup - 僅限遠端 PRs)
*   審查結束後，請詢問使用者是否要將分支切換回預設分支 (例如：`main` 或是 `master`)。
