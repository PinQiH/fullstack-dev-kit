---
name: git-workflow
description: 'Git 協作規範：分支命名、commit message 格式與 icon 對照、版本號規則。使用時機：開分支、確認 commit 格式、決定版本號。產生 commit 訊息改用 git-commit。'
---

# Git 協作規範

> 速查：本 skill 同目錄附精簡速查檔 `git-commit-format.md`。

## 1 基本原則

- Push 前務必先 **Pull**，解決衝突。

## 2 分支命名

使用全英文，格式：`<type>/<description>`

- **功能開發**：`feature/login-module`, `feature/bo_projects`
- **錯誤修復**：`bugfix/TASK-961`, `bugfix/API-87`
- **效能優化**：`perf/query-optimization`
- **重構**：`refactor/user-service`

## 3 Commit Message 格式

遵循 Angular Commit Message 規範。
**格式**：

```text
<icon> <type>(<scope>): <subject>

<body>
```

- **Type**:
  - 🎉 init：初始化專案或檔案時使用。
  - ✨ feat：新增功能或特性時使用。
  - 🐞 fix：修復程式錯誤時使用。
  - 📃 docs：僅進行文件內容更改時使用。
  - 🌈 style：程式碼格式調整，不影響程式邏輯（例如空白、格式或分號）時使用。
  - 🦄 refactor：進行程式碼重構，既不修復錯誤也不新增功能時使用。
  - 🎈 perf：優化效能相關的程式碼更改時使用。
  - 🧪 test：新增或修正測試時使用。
  - 🔧 build：調整建置流程或輔助工具時使用。
  - 🐎 ci：持續整合設定或腳本的更改時使用。
  - 🐳 chore：修改與程式碼邏輯無關的內容（如文件生成、工具設定）時使用。
  - ↩ revert：還原先前的變更時使用。
- **Subject**: 簡短描述 (可中文)，建議附上 API 或 Task 編號 (如 `API-70`)。

## 4 版本號

- **Major (1.0.0)**: 大幅修改，不相容更新。
- **Minor (1.1.0)**: 新增功能，向下相容。
- **Patch (1.1.1)**: Bug 修復。
