---
name: ux-heuristics
description: >
  UX 可用性啟發式評估技能模組。
  當任務涉及 UI 元件設計、表單設計、錯誤訊息撰寫、導航/資訊架構、
  或 Loading/Error/Empty 三態設計時，應載入此技能。
  強制以 Nielsen 10 大啟發式原則與 Vue 元件實作規範雙軌審查。
---

# UX Heuristics Skill

**Maintainer**: Zoe Chan
**Tech Stack**: Vue 3, Nuxt 3
**Core Principles**: Nielsen's 10 Heuristics | Feedback Completeness | Defensive UX

---

## 使用此技能的前置條件

在任何 UI 設計或元件實作前，你必須：

1. **識別 UX 任務類型**（見下方決策樹）
2. **載入對應的 `resources/` 規範文件**
3. **生成 UI 後，對照 [UX 自我檢查清單] 驗證**

---

## AI 決策樹 (Thinking Process)

### CASE A：涉及表單設計

```
偵測到以下關鍵字時觸發：
<form>, <input>, <select>, v-model, validate, submit, error message,
表單, 輸入框, 驗證, 必填, 送出

強制執行：
1. 載入 resources/02-Form-Usability.md
2. 確認驗證錯誤在 onBlur 或 onSubmit 後才顯示（禁止 onKeyDown 即時報錯）
3. 確認每個欄位有明確的 label（禁止 placeholder 替代 label）
4. 確認送出按鈕在 loading 時禁用並有視覺回饋

防守規則：
- 禁止 placeholder 充當 label（失去焦點後標示消失）
- 錯誤訊息必須描述「發生什麼問題」與「如何修正」（禁止只說「格式錯誤」）
- 多欄位表單必須支援 Tab 鍵序導航
- 送出中不可允許重複提交
```

### CASE B：涉及狀態回饋設計（Loading / Error / Empty）

```
偵測到以下關鍵字時觸發：
loading, skeleton, spinner, error state, empty state, 空狀態,
useAsyncState, useFetch, isLoading, isError, data?.length === 0

強制執行：
1. 載入 resources/03-Feedback-States.md
2. 確認三態（Loading / Error / Empty）都有對應 UI
3. 確認 Error State 提供可操作的修復入口（重試按鈕 / 返回連結）
4. 確認 Empty State 區分「無資料」與「搜尋無結果」兩種語意

防守規則：
- 禁止渲染空白區域（必須有 Empty State）
- 禁止讓 Error 靜默失敗（至少顯示提示訊息）
- Loading 時必須凍結互動，防止用戶重複操作
- Skeleton 外觀尺寸應與真實內容尺寸接近，減少 Layout Shift
```

### CASE C：涉及導航 / 資訊架構 / 整體 UI 流程

```
偵測到以下關鍵字時觸發：
navigation, breadcrumb, menu, wizard, step, 導航, 步驟, 流程, 路徑, 返回

強制執行：
1. 載入 resources/01-Nielsen-Heuristics.md
2. 確認用戶當前位置有明確指示（麵包屑 / 高亮選單項）
3. 確認所有操作都可撤銷或有確認步驟（Heuristic #3）
4. 確認錯誤訊息是人類語言，非技術代碼（Heuristic #9）
```

### CASE D：全面 UX Review（新頁面 / 重要元件）

```
偵測到以下關鍵字時觸發：
新增頁面, 新增元件, code review, UX review, 設計審查

強制執行：
1. 載入所有 resources/ 文件
2. 逐一對照 Nielsen 10 大原則輸出評分表
3. 輸出 UX 問題清單（等級：Critical / Major / Minor）
```

---

## UX 自我檢查清單

在提交任何 UI 元件或頁面前，逐項確認：

- [ ] **三態完整**：Loading / Error / Empty 三種狀態都有對應 UI？
- [ ] **錯誤可操作**：Error State 有明確的修復入口（重試 / 返回 / 聯絡支援）？
- [ ] **表單標籤**：每個 input 都有獨立的 `<label>` 元素？
- [ ] **錯誤描述**：驗證錯誤訊息說明了「問題」與「修正方式」？
- [ ] **位置感知**：用戶知道自己在哪個頁面 / 步驟？
- [ ] **可逆操作**：破壞性操作（刪除 / 送出）有確認機制？
- [ ] **一致性**：此元件的互動行為與其他頁面的同類元件一致？
- [ ] **無障礙基本盤**：有 aria-label / role / keyboard 支援（見 frontend_architect CASE G）？

---

## 高風險 UX 陷阱

以下設計模式在審查時必須特別標注：

1. **Ghost Button**：低對比度按鈕在白底上幾乎不可見
2. **Destructive Action 無確認**：刪除、清空等操作缺少二次確認
3. **Infinite Scroll 無終點提示**：用戶不知道是否已到底部
4. **Modal 內 Modal**：深層彈窗導致用戶迷失
5. **Toast 唯一通知**：重要訊息只靠 Toast 通知（3 秒後消失）
